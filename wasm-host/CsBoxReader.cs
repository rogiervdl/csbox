using System.Runtime.Versioning;
using System.Threading;

/// <summary>
/// Vervangt Console.In. Blokkeert via SemaphoreSlim.Wait() op de thread pool thread
/// totdat de gebruiker invoer geeft in de browser (via ProvideInput JSExport).
/// Detecteert de cancel-sentinel (\x03 = ETX) voor de Stop-knop.
/// </summary>
[SupportedOSPlatform("browser")]
internal sealed class CsBoxReader : TextReader
{
    private readonly Func<bool> _isCancelled;
    private readonly SemaphoreSlim _semaphore;
    private readonly Func<string> _getInput;

    private const char CancelSentinel = '\x03';

    internal CsBoxReader(Func<bool> isCancelled, SemaphoreSlim semaphore, Func<string> getInput)
    {
        _isCancelled = isCancelled;
        _semaphore   = semaphore;
        _getInput    = getInput;
    }

    public override string? ReadLine()
    {
        if (_isCancelled()) throw new OperationCanceledException();

        JsInterop.NotifyInputNeeded("line");
        _semaphore.Wait();

        var line = _getInput();
        if (line.Length == 1 && line[0] == CancelSentinel)
            throw new OperationCanceledException();

        return line;
    }

    public override int Read()
    {
        if (_isCancelled()) throw new OperationCanceledException();

        JsInterop.NotifyInputNeeded("key");
        _semaphore.Wait();

        var input = _getInput();
        if (input.Length == 1 && input[0] == CancelSentinel)
            throw new OperationCanceledException();

        return input.Length > 0 ? input[0] : -1;
    }

    public override int Peek() => -1;
}
