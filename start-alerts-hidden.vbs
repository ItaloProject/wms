Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c bun run """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\alert-server\index.js""", 0, False
