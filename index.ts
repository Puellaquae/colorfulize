import { spawn } from "child_process";
import { readFileSync } from "fs";
import * as lsp from "vscode-languageserver-protocol/node.js";

let proc = spawn("gopls")

let conn = lsp.createProtocolConnection(
    new lsp.StreamMessageReader(proc.stdout),
    new lsp.StreamMessageWriter(proc.stdin)
);

conn.listen();

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
                tokenTypes: [
                    lsp.SemanticTokenTypes.namespace,
                    lsp.SemanticTokenTypes.type,
                    lsp.SemanticTokenTypes.class,
                    lsp.SemanticTokenTypes.enum,
                    lsp.SemanticTokenTypes.interface,
                    lsp.SemanticTokenTypes.struct,
                    lsp.SemanticTokenTypes.typeParameter,
                    lsp.SemanticTokenTypes.parameter,
                    lsp.SemanticTokenTypes.variable,
                    lsp.SemanticTokenTypes.property,
                    lsp.SemanticTokenTypes.enumMember,
                    lsp.SemanticTokenTypes.event,
                    lsp.SemanticTokenTypes.function,
                    lsp.SemanticTokenTypes.method,
                    lsp.SemanticTokenTypes.macro,
                    lsp.SemanticTokenTypes.keyword,
                    lsp.SemanticTokenTypes.modifier,
                    lsp.SemanticTokenTypes.comment,
                    lsp.SemanticTokenTypes.string,
                    lsp.SemanticTokenTypes.number,
                    lsp.SemanticTokenTypes.regexp,
                    lsp.SemanticTokenTypes.operator,
                    lsp.SemanticTokenTypes.decorator
                ],
                tokenModifiers: [
                    lsp.SemanticTokenModifiers.declaration,
                    lsp.SemanticTokenModifiers.definition,
                    lsp.SemanticTokenModifiers.readonly,
                    lsp.SemanticTokenModifiers.static,
                    lsp.SemanticTokenModifiers.deprecated,
                    lsp.SemanticTokenModifiers.abstract,
                    lsp.SemanticTokenModifiers.async,
                    lsp.SemanticTokenModifiers.modification,
                    lsp.SemanticTokenModifiers.documentation,
                    lsp.SemanticTokenModifiers.defaultLibrary
                ],
                formats: ["relative"],
                overlappingTokenSupport: true,
                
            }
        },
        window: {
            workDoneProgress: true
        }
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

const hoverReq: lsp.HoverParams = {
    textDocument: {
        uri: "file://G:/code/go/btKeeper/main.go"
    },
    position: {
        line: 10,
        character: 12
    }
}

console.log("send hover");
let hoverRes = await conn.sendRequest(lsp.HoverRequest.type, hoverReq);
console.log("hover: ", hoverRes);

const semReq: lsp.SemanticTokensParams = {
    textDocument: {
        uri: "file://G:/code/go/btKeeper/main.go"
    }
}

console.log("send sem");
let semRes = await conn.sendRequest(lsp.SemanticTokensRequest.type, semReq);
console.log("sem: ", semRes);

await conn.sendNotification(lsp.ExitNotification.type);

conn.end();
