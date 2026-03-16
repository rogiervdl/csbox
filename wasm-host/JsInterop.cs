using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;

[SupportedOSPlatform("browser")]
internal static partial class JsInterop
{
    [JSImport("sendOutput", "csbox-interop")]
    internal static partial void SendOutput(string text);

    // mode = "line" of "key"
    [JSImport("notifyInputNeeded", "csbox-interop")]
    internal static partial void NotifyInputNeeded(string mode);

    [JSImport("sendDone", "csbox-interop")]
    internal static partial void SendDone(int exitCode);

    [JSImport("sendError", "csbox-interop")]
    internal static partial void SendError(string message);
}
