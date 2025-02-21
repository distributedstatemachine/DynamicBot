// Parse query parameters from URL.
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split('&').forEach(pairStr => {
        var [key, value] = pairStr.split('=');
        if (key) params[key] = decodeURIComponent(value);
    });
    return params;
}

async function signTransaction() {
    const params = getQueryParams();
    const tradeId = params.trade_id;
    const encodedPayload = params.payload;
    if (!tradeId || !encodedPayload) {
        alert("Missing trade_id or payload in URL.");
        return;
    }
    document.getElementById("tradeId").innerText = tradeId;

    let payloadStr;
    try {
        payloadStr = atob(encodedPayload);
    } catch (err) {
        alert("Error decoding payload: " + err);
        return;
    }
    let payload;
    try {
        payload = JSON.parse(payloadStr);
    } catch (err) {
        alert("Invalid JSON in payload: " + err);
        return;
    }
    document.getElementById("payload").innerText = JSON.stringify(payload, null, 2);

    const { web3Accounts, web3Enable, web3FromSource } = polkadotExtensionDapp;

    const extensions = await web3Enable("YourSigningService");
    if (extensions.length === 0) {
        alert('No Polkadot.js extension found – please install it.');
        return;
    }

    const accounts = await web3Accounts();
    let selectedAccount = accounts.find(acc => acc.address === payload.wallet);
    if (!selectedAccount) {
        alert("No matching account found for wallet: " + payload.wallet);
        return;
    }

    const injector = await web3FromSource(selectedAccount.meta.source);
    const signRaw = injector.signer && injector.signer.signRaw;
    if (!signRaw) {
        alert("Selected account does not support raw signing.");
        return;
    }

    try {
        const { signature } = await signRaw({
            address: selectedAccount.address,
            data: payloadStr, // Optionally hash this payload.
            type: 'bytes'
        });
        document.getElementById("signedTx").innerText = signature;
        document.getElementById("result").style.display = "block";
    } catch (error) {
        alert("Error during signing: " + error.message);
    }
}

document.getElementById("signButton").addEventListener("click", signTransaction);
document.getElementById("copyButton").addEventListener("click", function () {
    const signedTx = document.getElementById("signedTx").innerText;
    navigator.clipboard.writeText(signedTx).then(() => {
        alert("Signed transaction copied to clipboard!");
    }, err => {
        alert("Failed to copy: " + err);
    });
});