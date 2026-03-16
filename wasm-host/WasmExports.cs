using System.Reflection;
using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;
using System.Threading;

/// <summary>
/// Methodes die vanuit JavaScript aangeroepen kunnen worden (JSExport).
/// RunCode start het studentassembly op een thread pool thread zodat
/// de main JS thread vrij blijft voor input/output berichten.
/// Blocking I/O gebeurt via SemaphoreSlim.Wait() op de thread pool thread.
/// </summary>
[SupportedOSPlatform("browser")]
public static partial class WasmExports
{
    private static volatile bool _cancelled = false;
    private static string _inputBuffer = string.Empty;
    private static SemaphoreSlim _inputSemaphore = new SemaphoreSlim(0, 1);

    /// <summary>
    /// Laad en voer het gecompileerde studentassembly uit op een thread pool thread.
    /// Keert direct terug zodat de main JS thread vrij blijft voor I/O.
    /// </summary>
    [JSExport]
    public static Task RunCode(byte[] dllBytes)
    {
        _cancelled = false;

        // Semaphore resetten (drain eventueel achtergebleven signaal)
        while (_inputSemaphore.CurrentCount > 0)
            _inputSemaphore.Wait(0);

        var reader = new CsBoxReader(() => _cancelled, _inputSemaphore, () => _inputBuffer);
        var writer = new CsBoxWriter();

        Console.SetIn(reader);
        Console.SetOut(writer);
        Console.SetError(writer);

        Task.Run(() =>
        {
            try
            {
                var assembly = Assembly.Load(dllBytes);
                var entry    = assembly.EntryPoint
                               ?? throw new InvalidOperationException("Geen entry point gevonden in het assembly.");

                var prms = entry.GetParameters();
                var args = prms.Length > 0
                    ? new object[] { Array.Empty<string>() }
                    : Array.Empty<object>();

                var returnVal = entry.Invoke(null, args);

                if (returnVal is Task task)
                    task.GetAwaiter().GetResult();

                JsInterop.SendDone(0);
            }
            catch (OperationCanceledException)
            {
                JsInterop.SendDone(-1);
            }
            catch (TargetInvocationException ex)
            {
                var inner = ex.InnerException;
                if (inner is OperationCanceledException)
                    JsInterop.SendDone(-1);
                else
                {
                    JsInterop.SendError(inner?.Message ?? ex.Message);
                    JsInterop.SendDone(1);
                }
            }
            catch (Exception ex)
            {
                JsInterop.SendError(ex.Message);
                JsInterop.SendDone(1);
            }
        });

        return Task.CompletedTask;
    }

    /// <summary>
    /// Levert invoer aan de wachtende CsBoxReader.
    /// Aangeroepen vanuit JavaScript wanneer de gebruiker invoer geeft.
    /// </summary>
    [JSExport]
    public static Task ProvideInput(string input)
    {
        _inputBuffer = input;
        _inputSemaphore.Release();
        return Task.CompletedTask;
    }

    /// <summary>
    /// Stel de cancel-vlag in (Stop-knop).
    /// Wekt ook een eventueel geblokkeerde ReadLine/ReadKey.
    /// </summary>
    [JSExport]
    public static Task SetCancelled()
    {
        _cancelled = true;
        _inputBuffer = "\x03"; // cancel sentinel
        // Release semaphore als C# wacht op invoer
        if (_inputSemaphore.CurrentCount == 0)
            _inputSemaphore.Release();
        return Task.CompletedTask;
    }
}
