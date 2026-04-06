import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const results: Record<string, unknown> = {};

  // Check env vars
  results.hasPrivateKey = !!process.env.AGENTCASH_PRIVATE_KEY;
  results.privateKeyLength = process.env.AGENTCASH_PRIVATE_KEY?.length ?? 0;
  results.mockMode = process.env.STABLESOCIAL_MOCK;

  // Try importing and initializing the x402 stack
  try {
    const { createWalletClient, http } = await import("viem");
    const { privateKeyToAccount } = await import("viem/accounts");
    const { base } = await import("viem/chains");

    const key = process.env.AGENTCASH_PRIVATE_KEY!;
    const pk = (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`;
    const account = privateKeyToAccount(pk);
    results.walletAddress = account.address;

    const wallet = createWalletClient({ account, chain: base, transport: http() });
    results.walletAccountAddress = wallet.account?.address;

    // Try a simple fetch to StableSocial to test connectivity
    const testRes = await fetch("https://stablesocial.dev/api/reddit/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: "test", max_posts: 1, max_page_size: 1 }),
    });
    results.testFetchStatus = testRes.status;
    results.testFetchHeaders = Object.fromEntries(testRes.headers.entries());

    if (testRes.status === 402) {
      const body = await testRes.json();
      results.paymentRequiredVersion = body?.x402Version;
      results.hasAccepts = !!(body?.accepts?.length > 0);
      results.hasSIWX = !!(body?.extensions?.["sign-in-with-x"]);
      results.acceptsNetworks = body?.accepts?.map((a: Record<string, unknown>) => a.network);
    }

    // Now try the full x402 flow
    const { x402Client, x402HTTPClient } = await import("@x402/core/client");
    const { ExactEvmScheme, toClientEvmSigner } = await import("@x402/evm");
    const { createSIWxMessage, encodeSIWxHeader } = await import("@x402/extensions");

    Object.assign(wallet, { address: wallet.account!.address });
    const signer = toClientEvmSigner(wallet as never);
    results.signerAddress = signer.address;

    const scheme = new ExactEvmScheme(signer);
    const client = new x402Client();
    client.register("eip155:8453", scheme);
    client.registerV1("base", scheme);
    client.register("eip155:98865", scheme);
    client.registerV1("tempo", scheme);
    const httpClient = new x402HTTPClient(client);

    // Try the actual payment
    const payRes = await fetch("https://stablesocial.dev/api/reddit/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: "test", max_posts: 1, max_page_size: 1 }),
    });

    if (payRes.status === 402) {
      const body = await payRes.json();
      const getHeader = (name: string) => payRes.headers.get(name);

      try {
        const paymentRequired = httpClient.getPaymentRequiredResponse(getHeader, body);
        results.paymentRequiredParsed = true;

        const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
        results.paymentPayloadCreated = true;

        const signatureHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
        results.signatureHeaderKeys = Object.keys(signatureHeaders);

        // Make the paid request
        const paidRes = await fetch("https://stablesocial.dev/api/reddit/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...signatureHeaders,
          },
          body: JSON.stringify({ keywords: "test", max_posts: 1, max_page_size: 1 }),
        });
        results.paidResponseStatus = paidRes.status;
        const paidBody = await paidRes.json();
        results.paidResponseKeys = Object.keys(paidBody);
        results.hasToken = !!paidBody?.token;

        if (paidBody?.token) {
          // Try SIWX poll
          const pollUrl = `https://stablesocial.dev/api/jobs?token=${encodeURIComponent(paidBody.token)}`;
          const pollChallengeRes = await fetch(pollUrl, {
            headers: { "Content-Type": "application/json" },
          });
          results.pollChallengeStatus = pollChallengeRes.status;

          if (pollChallengeRes.status === 402) {
            const pollBody = await pollChallengeRes.json();
            const siwx = pollBody?.extensions?.["sign-in-with-x"];
            results.siwxChallenge = !!siwx;

            if (siwx) {
              const evmChain = siwx.supportedChains.find((c: { type: string }) => c.type === "eip191");
              const info = { ...siwx.info, chainId: evmChain.chainId, type: evmChain.type };
              const message = createSIWxMessage(info, wallet.account!.address);
              const signature = await wallet.signMessage({ message });
              const siwxPayload = {
                domain: info.domain,
                address: wallet.account!.address,
                statement: info.statement,
                uri: info.uri,
                version: info.version,
                chainId: info.chainId,
                type: info.type,
                nonce: info.nonce,
                issuedAt: info.issuedAt,
                expirationTime: info.expirationTime,
                signature,
              };
              const siwxHeader = encodeSIWxHeader(siwxPayload);
              results.siwxHeaderType = typeof siwxHeader;

              const pollAuthRes = await fetch(pollUrl, {
                headers: { "Content-Type": "application/json", "sign-in-with-x": siwxHeader as string },
              });
              results.pollAuthStatus = pollAuthRes.status;
              const pollAuthBody = await pollAuthRes.json();
              results.pollAuthBodyKeys = Object.keys(pollAuthBody);
              results.pollStatus = pollAuthBody?.status;
            }
          }
        }
      } catch (e) {
        results.paymentError = (e as Error).message;
      }
    }
  } catch (e) {
    results.error = (e as Error).message;
    results.stack = (e as Error).stack?.split("\n").slice(0, 5);
  }

  return Response.json(results, { status: 200 });
}
