using System.Runtime.Versioning;
using System.Text;

/// <summary>
/// Vervangt Console.Out en Console.Error.
/// Alle output wordt via postMessage naar de main thread gestuurd.
/// </summary>
[SupportedOSPlatform("browser")]
internal sealed class CsBoxWriter : TextWriter
{
    public override Encoding Encoding => Encoding.UTF8;

    public override void Write(char value)        => JsInterop.SendOutput(value.ToString());
    public override void Write(string? value)     => JsInterop.SendOutput(value ?? string.Empty);
    public override void WriteLine()              => JsInterop.SendOutput("\n");
    public override void WriteLine(string? value) => JsInterop.SendOutput((value ?? string.Empty) + "\n");

    public override void Write(bool value)    => JsInterop.SendOutput(value ? "True" : "False");
    public override void Write(int value)     => JsInterop.SendOutput(value.ToString());
    public override void Write(long value)    => JsInterop.SendOutput(value.ToString());
    public override void Write(double value)  => JsInterop.SendOutput(value.ToString());
    public override void Write(object? value) => JsInterop.SendOutput(value?.ToString() ?? string.Empty);

    public override void WriteLine(bool value)    => JsInterop.SendOutput((value ? "True" : "False") + "\n");
    public override void WriteLine(int value)     => JsInterop.SendOutput(value.ToString() + "\n");
    public override void WriteLine(long value)    => JsInterop.SendOutput(value.ToString() + "\n");
    public override void WriteLine(double value)  => JsInterop.SendOutput(value.ToString() + "\n");
    public override void WriteLine(object? value) => JsInterop.SendOutput((value?.ToString() ?? string.Empty) + "\n");

    public override void Flush() { /* no-op */ }
}
