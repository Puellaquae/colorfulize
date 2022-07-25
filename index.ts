import { spawn } from "child_process";
import * as lsp from "vscode-languageserver-protocol/node";

let proc = spawn("gopls")

let conn = lsp.createProtocolConnection(
    new lsp.StreamMessageReader(proc.stdout),
    new lsp.StreamMessageWriter(proc.stdin)
);

conn.listen();

const init: lsp.InitializeParams = {
    rootUri: "file://G:/code/go/btKeeper",
    processId: 1,
    capabilities: {}
};

let res = await conn.sendRequest(lsp.InitializeRequest.type, init);

console.log(res);
