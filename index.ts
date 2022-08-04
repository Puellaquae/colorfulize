import { spawn } from "child_process";
import { readFileSync } from "fs";
import * as lsp from "vscode-languageserver-protocol/node.js";

let proc = spawn("gopls")

let conn = lsp.createProtocolConnection(
    new lsp.StreamMessageReader(proc.stdout),
    new lsp.StreamMessageWriter(proc.stdin)
);

conn.listen();

const SemTokenTypes = [];

for (const type in lsp.SemanticTokenTypes) {
    SemTokenTypes.push(type);
}

const SemTokenModifiers = [];

for (const modifier in lsp.SemanticTokenModifiers) {
    SemTokenModifiers.push(modifier);
}

const initReq: lsp.InitializeParams = {
    rootUri: "file://G:/code/go/btKeeper",
    workspaceFolders: [
        {
            uri: "file://G:/code/go/btKeeper",
            name: "btKeeper"
        }
    ],
    processId: process.pid,
    capabilities: {
        textDocument: {
            synchronization: {
                dynamicRegistration: false,
                didSave: false,
                willSave: false,
                willSaveWaitUntil: false
            },
            hover: {
                dynamicRegistration: false,
                contentFormat: [lsp.MarkupKind.Markdown, lsp.MarkupKind.PlainText]
            },
            documentSymbol: {
                dynamicRegistration: false,
                symbolKind: {
                    valueSet: [
                        lsp.SymbolKind.File,
                        lsp.SymbolKind.Module,
                        lsp.SymbolKind.Namespace,
                        lsp.SymbolKind.Package,
                        lsp.SymbolKind.Class,
                        lsp.SymbolKind.Method,
                        lsp.SymbolKind.Property,
                        lsp.SymbolKind.Field,
                        lsp.SymbolKind.Constructor,
                        lsp.SymbolKind.Enum,
                        lsp.SymbolKind.Interface,
                        lsp.SymbolKind.Function,
                        lsp.SymbolKind.Variable,
                        lsp.SymbolKind.Constant,
                        lsp.SymbolKind.String,
                        lsp.SymbolKind.Number,
                        lsp.SymbolKind.Boolean,
                        lsp.SymbolKind.Array,
                        lsp.SymbolKind.Object,
                        lsp.SymbolKind.Key,
                        lsp.SymbolKind.Null,
                        lsp.SymbolKind.EnumMember,
                        lsp.SymbolKind.Struct,
                        lsp.SymbolKind.Event,
                        lsp.SymbolKind.Operator,
                        lsp.SymbolKind.TypeParameter
                    ]
                },
                hierarchicalDocumentSymbolSupport: true,
                labelSupport: true
            },
            semanticTokens: {
                dynamicRegistration: false,
                requests: {
                    range: true,
                    full: true
                },
                tokenTypes: SemTokenTypes,
                tokenModifiers: SemTokenModifiers,
                formats: ["relative"],
                overlappingTokenSupport: true,

            }
        },
        window: {
            workDoneProgress: true
        }
    },
    initializationOptions: {
        semanticTokens: true
    },
    trace: "verbose"
};

console.log("send init");
let initRes = await conn.sendRequest(lsp.InitializeRequest.type, initReq);

console.log("init: ", initRes);

conn.onNotification(lsp.LogTraceNotification.type, (msg) => {
    console.log("log: ", msg);
})

conn.onNotification(lsp.ShowMessageNotification.type, (msg) => {
    console.log("msg: ", msg);
})

conn.onRequest(lsp.WorkDoneProgressCreateRequest.type, (req) => {
    console.log("create work done: ", req);

    conn.onProgress(lsp.WorkDoneProgress.type, req.token, (ev) => {
        console.log(`process ${req.token}: ${ev.kind} ${ev.message}`);
    })
})

console.log("send inited");
await conn.sendNotification(lsp.InitializedNotification.type, {});

const codeText = readFileSync("G:/code/go/btKeeper/main.go").toString("utf-8");

const codeLines = codeText.split("\r\n");

console.log(codeLines);

const openReq: lsp.DidOpenTextDocumentParams = {
    textDocument: {
        uri: "file://G:/code/go/btKeeper/main.go",
        languageId: "go",
        version: 0,
        text: codeText
    }
}

console.log("send didOpen");
await conn.sendNotification(lsp.DidOpenTextDocumentNotification.type, openReq);

const symReq: lsp.DocumentSymbolParams = {
    textDocument: {
        uri: "file://G:/code/go/btKeeper/main.go"
    }
}

console.log("send sym")
let symRes = await conn.sendRequest(lsp.DocumentSymbolRequest.type, symReq);

console.log("symbol: ", symRes);

const semReq: lsp.SemanticTokensParams = {
    textDocument: {
        uri: "file://G:/code/go/btKeeper/main.go"
    }
}

console.log("send sem");
let semRes = await conn.sendRequest(lsp.SemanticTokensRequest.type, semReq);

if (semRes !== null) {
    const data = semRes.data;
    let curLine = 0;
    let curStart = 0;
    for (let i = 0; i < data.length; i += 5) {
        const deltaLine = data[i];
        curLine += deltaLine;
        if (deltaLine !== 0) {
            curStart = 0;
        }
        const deltaStart = data[i + 1];
        curStart += deltaStart;
        const length = data[i + 2];
        const code = codeLines[curLine].substring(curStart, curStart + length);
        const tokenModifiers = [];
        const modifier = data[i + 4];
        for (let j = 0; j < SemTokenModifiers.length; j++) {
            if ((modifier & (1 << j)) !== 0) {
                tokenModifiers.push(SemTokenModifiers[j]);
            }
        }
        console.log(`${code} tokenTypes: ${SemTokenTypes[data[i + 3]]}; tokenModifier: ${data[i + 4]} ${JSON.stringify(tokenModifiers)}`);
    }
}

const hoverReq: lsp.HoverParams = {
    textDocument: {
        uri: "file://G:/code/go/btKeeper/main.go"
    },
    position: {
        line: 16,
        character: 17
    }
}

console.log("send hover");
let hoverRes = await conn.sendRequest(lsp.HoverRequest.type, hoverReq);
console.log("hover: ", hoverRes);

await conn.sendNotification(lsp.ExitNotification.type);

conn.end();
