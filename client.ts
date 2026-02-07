import { swapActions } from "@account-kit/wallet-client/experimental";
import { client, signer } from "./client";

// Add the swap actions to the client
const swapClient = client.extend(swapActions);

// Request the swap quote
const { quote, ...calls } = await swapClient.requestQuoteV0({
  from: await signer.getAddress(), // Your wallet address
  fromToken: "0x...",
  toToken: "0x...",
  minimumToAmount: "0x...",
});

// Display the swap quote, including the minimum amount to receive and the expiry
console.log(quote);

// Assert that the calls are not raw calls.
// This will always be the case when requestQuoteV0 is used without the `returnRawCalls` option,
// the assertion is just needed for Typescript to recognize the result type.
if (calls.rawCalls) {
  throw new Error("Expected user operation calls");
}

// Sign the quote, getting back prepared and signed calls
const signedCalls = await swapClient.signPreparedCalls(calls);

// Send the prepared calls
const { preparedCallIds } = await swapClient.sendPreparedCalls(signedCalls);

// Wait for the call to resolve
const callStatusResult = await swapClient.waitForCallsStatus({
  id: preparedCallIds[0]!,
});

// Filter through success or failure cases
if (
  callStatusResult.status !== "success" ||
  !callStatusResult.receipts ||
  !callStatusResult.receipts[0]
) {
  throw new Error(
    `Transaction failed with status ${callStatusResult.status}, full receipt:\n ${JSON.stringify(callStatusResult, null, 2)}`,
  );
}

console.log("Swap confirmed!");
console.log(
  `Transaction hash: ${callStatusResult.receipts[0].transactionHash}`,
);
