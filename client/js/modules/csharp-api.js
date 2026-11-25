/*
 * De C#-API voor de aanvulling
 *
 * Een beperkte, vaste lijst die past bij de cursus: namespaces, de types die
 * een student gebruikt met hun namespace, en hun leden. Een lid dat eindigt
 * op () is een methode, de rest is een property of een veld.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

// de namespaces die na using voorgesteld worden
const NAMESPACES = [
   'System',
   'System.Collections.Generic',
   'System.Diagnostics',
   'System.Globalization',
   'System.IO',
   'System.Linq',
   'System.Text',
   'System.Text.Json',
   'System.Threading',
   'System.Threading.Tasks',
];

// de types die voorgesteld worden als hun namespace geïmporteerd is
const TYPES = {
   Array: 'System',
   Console: 'System',
   ConsoleColor: 'System',
   ConsoleKey: 'System',
   Convert: 'System',
   DateTime: 'System',
   Environment: 'System',
   Exception: 'System',
   Math: 'System',
   Random: 'System',
   TimeSpan: 'System',
   Dictionary: 'System.Collections.Generic',
   HashSet: 'System.Collections.Generic',
   KeyValuePair: 'System.Collections.Generic',
   List: 'System.Collections.Generic',
   Queue: 'System.Collections.Generic',
   Stack: 'System.Collections.Generic',
   Directory: 'System.IO',
   File: 'System.IO',
   Path: 'System.IO',
   StreamReader: 'System.IO',
   StreamWriter: 'System.IO',
   StringBuilder: 'System.Text',
   Thread: 'System.Threading',
   Stopwatch: 'System.Diagnostics',
   CultureInfo: 'System.Globalization',
};

// de C#-aliassen van de .NET-types
const ALIASSEN = { String: 'string', Int32: 'int', Int64: 'long', Double: 'double', Decimal: 'decimal', Boolean: 'bool', Char: 'char', Object: 'object' };

// de statische leden per type
const STATISCH = {
   Array: ['Sort()', 'Reverse()', 'IndexOf()', 'Resize()', 'Fill()', 'Exists()', 'Find()', 'Copy()'],
   Console: ['WriteLine()', 'Write()', 'ReadLine()', 'ReadKey()', 'Clear()', 'ResetColor()', 'ForegroundColor', 'BackgroundColor'],
   Convert: ['ToInt32()', 'ToDouble()', 'ToDecimal()', 'ToBoolean()', 'ToChar()', 'ToString()'],
   DateTime: ['Now', 'Today', 'Parse()', 'TryParse()', 'DaysInMonth()', 'IsLeapYear()'],
   Directory: ['Exists()', 'CreateDirectory()', 'GetFiles()'],
   Environment: ['NewLine', 'Exit()'],
   File: ['ReadAllText()', 'ReadAllLines()', 'ReadLines()', 'WriteAllText()', 'WriteAllLines()', 'AppendAllText()', 'AppendAllLines()', 'Exists()', 'Delete()'],
   Math: ['Abs()', 'Max()', 'Min()', 'Pow()', 'Sqrt()', 'Round()', 'Floor()', 'Ceiling()', 'Truncate()', 'Sign()', 'Clamp()', 'Sin()', 'Cos()', 'Tan()', 'PI', 'E'],
   Path: ['Combine()', 'GetFileName()', 'GetExtension()', 'GetFileNameWithoutExtension()'],
   Thread: ['Sleep()'],
   TimeSpan: ['FromDays()', 'FromHours()', 'FromMinutes()', 'FromSeconds()', 'FromMilliseconds()'],
   Stopwatch: ['StartNew()'],
   CultureInfo: ['InvariantCulture', 'CurrentCulture'],
   bool: ['Parse()', 'TryParse()'],
   char: ['IsDigit()', 'IsLetter()', 'IsLetterOrDigit()', 'IsUpper()', 'IsLower()', 'IsWhiteSpace()', 'IsPunctuation()', 'ToUpper()', 'ToLower()'],
   decimal: ['Parse()', 'TryParse()', 'Round()', 'MaxValue', 'MinValue'],
   double: ['Parse()', 'TryParse()', 'IsNaN()', 'MaxValue', 'MinValue', 'NaN', 'PositiveInfinity', 'NegativeInfinity'],
   int: ['Parse()', 'TryParse()', 'MaxValue', 'MinValue'],
   long: ['Parse()', 'TryParse()', 'MaxValue', 'MinValue'],
   string: ['IsNullOrEmpty()', 'IsNullOrWhiteSpace()', 'Join()', 'Concat()', 'Format()', 'Compare()', 'Empty'],
};

// de waarden van de enums
const ENUMS = {
   ConsoleColor: ['Black', 'DarkBlue', 'DarkGreen', 'DarkCyan', 'DarkRed', 'DarkMagenta', 'DarkYellow', 'Gray', 'DarkGray', 'Blue', 'Green', 'Cyan', 'Red', 'Magenta', 'Yellow', 'White'],
   ConsoleKey: ['Enter', 'Escape', 'Spacebar', 'Backspace', 'Tab', 'UpArrow', 'DownArrow', 'LeftArrow', 'RightArrow', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'],
};

// de leden die elk object heeft
const OBJECT = ['ToString()', 'Equals()', 'GetHashCode()', 'GetType()'];

// de leden per type op een object
const INSTANTIE = {
   string: ['Length', 'ToUpper()', 'ToLower()', 'Trim()', 'TrimStart()', 'TrimEnd()', 'Split()', 'Substring()', 'Contains()', 'StartsWith()', 'EndsWith()', 'IndexOf()', 'LastIndexOf()', 'Replace()', 'PadLeft()', 'PadRight()', 'Insert()', 'Remove()', 'ToCharArray()', 'CompareTo()'],
   List: ['Count', 'Add()', 'AddRange()', 'Insert()', 'Remove()', 'RemoveAt()', 'RemoveAll()', 'Clear()', 'Contains()', 'IndexOf()', 'Find()', 'FindAll()', 'FindIndex()', 'Exists()', 'Sort()', 'Reverse()', 'ToArray()', 'ForEach()'],
   Dictionary: ['Count', 'Keys', 'Values', 'Add()', 'Remove()', 'ContainsKey()', 'ContainsValue()', 'TryGetValue()', 'Clear()'],
   HashSet: ['Count', 'Add()', 'Remove()', 'Contains()', 'Clear()', 'UnionWith()', 'IntersectWith()'],
   Queue: ['Count', 'Enqueue()', 'Dequeue()', 'Peek()', 'Contains()', 'Clear()'],
   Stack: ['Count', 'Push()', 'Pop()', 'Peek()', 'Contains()', 'Clear()'],
   KeyValuePair: ['Key', 'Value'],
   array: ['Length'],
   StringBuilder: ['Length', 'Append()', 'AppendLine()', 'Insert()', 'Remove()', 'Replace()', 'Clear()'],
   Random: ['Next()', 'NextDouble()'],
   DateTime: ['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second', 'DayOfWeek', 'DayOfYear', 'Date', 'AddDays()', 'AddMonths()', 'AddYears()', 'AddHours()', 'AddMinutes()', 'AddSeconds()', 'Subtract()', 'ToShortDateString()', 'ToShortTimeString()'],
   TimeSpan: ['Days', 'Hours', 'Minutes', 'Seconds', 'Milliseconds', 'TotalDays', 'TotalHours', 'TotalMinutes', 'TotalSeconds', 'TotalMilliseconds'],
   Exception: ['Message', 'StackTrace', 'InnerException'],
   StreamReader: ['ReadLine()', 'ReadToEnd()', 'EndOfStream', 'Close()'],
   StreamWriter: ['WriteLine()', 'Write()', 'Close()'],
   Stopwatch: ['Start()', 'Stop()', 'Reset()', 'Restart()', 'Elapsed', 'ElapsedMilliseconds'],
   ConsoleKeyInfo: ['Key', 'KeyChar'],
   int: ['CompareTo()'],
   double: ['CompareTo()'],
   decimal: ['CompareTo()'],
   char: ['CompareTo()'],
};

// de LINQ-methodes op een verzameling, met using System.Linq
const LINQ = ['Where()', 'Select()', 'OrderBy()', 'OrderByDescending()', 'ThenBy()', 'First()', 'FirstOrDefault()', 'Last()', 'LastOrDefault()', 'Single()', 'Any()', 'All()', 'Count()', 'Sum()', 'Average()', 'Min()', 'Max()', 'Distinct()', 'Take()', 'Skip()', 'Contains()', 'ToList()', 'ToArray()', 'GroupBy()', 'Reverse()'];

// de verzamelingen waarop LINQ werkt
const VERZAMELINGEN = ['List', 'Dictionary', 'HashSet', 'Queue', 'Stack', 'array'];

// de sleutelwoorden en ingebouwde types
const SLEUTELWOORDEN = [
   'abstract', 'as', 'base', 'bool', 'break', 'case', 'catch', 'char', 'class', 'const', 'continue', 'decimal',
   'default', 'do', 'double', 'else', 'enum', 'false', 'finally', 'float', 'for', 'foreach', 'get', 'if', 'in',
   'int', 'interface', 'internal', 'is', 'long', 'namespace', 'new', 'null', 'object', 'out', 'override',
   'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sealed', 'set', 'static', 'string', 'struct',
   'switch', 'this', 'throw', 'true', 'try', 'using', 'var', 'virtual', 'void', 'while',
];

// de snippets: afkorting, uitleg en tekst ({{klasse}} wordt de naam van de huidige klasse)
const SNIPPETS = [
   { naam: 'cw', uitleg: 'Console.WriteLine', tekst: 'Console.WriteLine($0);' },
   { naam: 'for', uitleg: 'for-lus', tekst: 'for (int ${1:i} = 0; ${1:i} < ${2:lengte}; ${1:i}++)\n{\n\t$0\n}' },
   { naam: 'foreach', uitleg: 'foreach-lus', tekst: 'foreach (${1:var} ${2:item} in ${3:lijst})\n{\n\t$0\n}' },
   { naam: 'if', uitleg: 'if', tekst: 'if (${1:voorwaarde})\n{\n\t$0\n}' },
   { naam: 'else', uitleg: 'else', tekst: 'else\n{\n\t$0\n}' },
   { naam: 'while', uitleg: 'while-lus', tekst: 'while (${1:voorwaarde})\n{\n\t$0\n}' },
   { naam: 'do', uitleg: 'do-while-lus', tekst: 'do\n{\n\t$0\n} while (${1:voorwaarde});' },
   { naam: 'switch', uitleg: 'switch', tekst: 'switch (${1:waarde})\n{\n\tcase ${2:1}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}' },
   { naam: 'try', uitleg: 'try-catch', tekst: 'try\n{\n\t$0\n}\ncatch (Exception ex)\n{\n\tConsole.WriteLine(ex.Message);\n}' },
   { naam: 'prop', uitleg: 'property', tekst: 'public ${1:int} ${2:Naam} { get; set; }' },
   { naam: 'ctor', uitleg: 'constructor', tekst: 'public {{klasse}}($1)\n{\n\t$0\n}' },
   { naam: 'class', uitleg: 'klasse', tekst: 'class ${1:Naam}\n{\n\t$0\n}' },
   { naam: 'svm', uitleg: 'static void Main', tekst: 'public static void Main()\n{\n\t$0\n}' },
];

// EXPORTS
// =======

export const CSharpApi = { NAMESPACES, TYPES, ALIASSEN, STATISCH, ENUMS, OBJECT, INSTANTIE, LINQ, VERZAMELINGEN, SLEUTELWOORDEN, SNIPPETS };
