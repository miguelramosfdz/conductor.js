var define, requireModule;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requireModule = function(name) {
    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(deps[i]));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;
  };
})();

/*
 Version: core-1.0
 The MIT License: Copyright (c) 2012 LiosK.
*/
function UUID(){}UUID.generate=function(){var a=UUID._gri,b=UUID._ha;return b(a(32),8)+"-"+b(a(16),4)+"-"+b(16384|a(12),4)+"-"+b(32768|a(14),4)+"-"+b(a(48),12)};UUID._gri=function(a){return 0>a?NaN:30>=a?0|Math.random()*(1<<a):53>=a?(0|1073741824*Math.random())+1073741824*(0|Math.random()*(1<<a-30)):NaN};UUID._ha=function(a,b){for(var c=a.toString(16),d=b-c.length,e="0";0<d;d>>>=1,e+=e)d&1&&(c=e+c);return c};

/*! Kamino v0.0.1 | http://github.com/Cyril-sf/kamino.js | Copyright 2012, Kit Cambridge | http://kit.mit-license.org */
(function(window) {
  // Convenience aliases.
  var getClass = {}.toString, isProperty, forEach, undef;

  Kamino = {};
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Kamino;
    }
    exports.Kamino = Kamino;
  } else {
    window['Kamino'] = Kamino;
  }

  Kamino.VERSION = '0.1.0';

  KaminoException = function() {
    this.name = "KaminoException";
    this.number = 25;
    this.message = "Uncaught Error: DATA_CLONE_ERR: Kamino Exception 25";
  };

  // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
  var isExtended = new Date(-3509827334573292);
  try {
    // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
    // results for certain dates in Opera >= 10.53.
    isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() == 1 &&
      // Safari < 2.0.2 stores the internal millisecond time value correctly,
      // but clips the values returned by the date methods to the range of
      // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
      isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
  } catch (exception) {}

  // IE <= 7 doesn't support accessing string characters using square
  // bracket notation. IE 8 only supports this for primitives.
  var charIndexBuggy = "A"[0] != "A";

  // Define additional utility methods if the `Date` methods are buggy.
  if (!isExtended) {
    var floor = Math.floor;
    // A mapping between the months of the year and the number of days between
    // January 1st and the first of the respective month.
    var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    // Internal: Calculates the number of days between the Unix epoch and the
    // first day of the given month.
    var getDay = function (year, month) {
      return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
    };
  }

  // Internal: Determines if a property is a direct property of the given
  // object. Delegates to the native `Object#hasOwnProperty` method.
  if (!(isProperty = {}.hasOwnProperty)) {
    isProperty = function (property) {
      var members = {}, constructor;
      if ((members.__proto__ = null, members.__proto__ = {
        // The *proto* property cannot be set multiple times in recent
        // versions of Firefox and SeaMonkey.
        "toString": 1
      }, members).toString != getClass) {
        // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
        // supports the mutable *proto* property.
        isProperty = function (property) {
          // Capture and break the object's prototype chain (see section 8.6.2
          // of the ES 5.1 spec). The parenthesized expression prevents an
          // unsafe transformation by the Closure Compiler.
          var original = this.__proto__, result = property in (this.__proto__ = null, this);
          // Restore the original prototype chain.
          this.__proto__ = original;
          return result;
        };
      } else {
        // Capture a reference to the top-level `Object` constructor.
        constructor = members.constructor;
        // Use the `constructor` property to simulate `Object#hasOwnProperty` in
        // other environments.
        isProperty = function (property) {
          var parent = (this.constructor || constructor).prototype;
          return property in this && !(property in parent && this[property] === parent[property]);
        };
      }
      members = null;
      return isProperty.call(this, property);
    };
  }

  // Internal: Normalizes the `for...in` iteration algorithm across
  // environments. Each enumerated key is yielded to a `callback` function.
  forEach = function (object, callback) {
    var size = 0, Properties, members, property, forEach;

    // Tests for bugs in the current environment's `for...in` algorithm. The
    // `valueOf` property inherits the non-enumerable flag from
    // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
    (Properties = function () {
      this.valueOf = 0;
    }).prototype.valueOf = 0;

    // Iterate over a new instance of the `Properties` class.
    members = new Properties();
    for (property in members) {
      // Ignore all properties inherited from `Object.prototype`.
      if (isProperty.call(members, property)) {
        size++;
      }
    }
    Properties = members = null;

    // Normalize the iteration algorithm.
    if (!size) {
      // A list of non-enumerable properties inherited from `Object.prototype`.
      members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
      // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
      // properties.
      forEach = function (object, callback) {
        var isFunction = getClass.call(object) == "[object Function]", property, length;
        for (property in object) {
          // Gecko <= 1.0 enumerates the `prototype` property of functions under
          // certain conditions; IE does not.
          if (!(isFunction && property == "prototype") && isProperty.call(object, property)) {
            callback(property);
          }
        }
        // Manually invoke the callback for each non-enumerable property.
        for (length = members.length; property = members[--length]; isProperty.call(object, property) && callback(property));
      };
    } else if (size == 2) {
      // Safari <= 2.0.4 enumerates shadowed properties twice.
      forEach = function (object, callback) {
        // Create a set of iterated properties.
        var members = {}, isFunction = getClass.call(object) == "[object Function]", property;
        for (property in object) {
          // Store each property name to prevent double enumeration. The
          // `prototype` property of functions is not enumerated due to cross-
          // environment inconsistencies.
          if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
            callback(property);
          }
        }
      };
    } else {
      // No bugs detected; use the standard `for...in` algorithm.
      forEach = function (object, callback) {
        var isFunction = getClass.call(object) == "[object Function]", property, isConstructor;
        for (property in object) {
          if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
            callback(property);
          }
        }
        // Manually invoke the callback for the `constructor` property due to
        // cross-environment inconsistencies.
        if (isConstructor || isProperty.call(object, (property = "constructor"))) {
          callback(property);
        }
      };
    }
    return forEach(object, callback);
  };

  // Public: Serializes a JavaScript `value` as a string. The optional
  // `filter` argument may specify either a function that alters how object and
  // array members are serialized, or an array of strings and numbers that
  // indicates which properties should be serialized. The optional `width`
  // argument may be either a string or number that specifies the indentation
  // level of the output.

  // Internal: A map of control characters and their escaped equivalents.
  var Escapes = {
    "\\": "\\\\",
    '"': '\\"',
    "\b": "\\b",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t"
  };

  // Internal: Converts `value` into a zero-padded string such that its
  // length is at least equal to `width`. The `width` must be <= 6.
  var toPaddedString = function (width, value) {
    // The `|| 0` expression is necessary to work around a bug in
    // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
    return ("000000" + (value || 0)).slice(-width);
  };

  // Internal: Double-quotes a string `value`, replacing all ASCII control
  // characters (characters with code unit values between 0 and 31) with
  // their escaped equivalents. This is an implementation of the
  // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
  var quote = function (value) {
    var result = '"', index = 0, symbol;
    for (; symbol = value.charAt(index); index++) {
      // Escape the reverse solidus, double quote, backspace, form feed, line
      // feed, carriage return, and tab characters.
      result += '\\"\b\f\n\r\t'.indexOf(symbol) > -1 ? Escapes[symbol] :
        // If the character is a control character, append its Unicode escape
        // sequence; otherwise, append the character as-is.
        (Escapes[symbol] = symbol < " " ? "\\u00" + toPaddedString(2, symbol.charCodeAt(0).toString(16)) : symbol);
    }
    return result + '"';
  };

  // Internal: detects if an object is a DOM element.
  // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
  var isElement = function(o) {
    return (
      typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
      o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName==="string"
    );
  };

  // Internal: Recursively serializes an object. Implements the
  // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
  var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
    var value = object[property], originalClassName, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, any, result,
        regExpSource, regExpModifiers = "";
    if( value instanceof Error || value instanceof Function) {
      throw new KaminoException();
    }
    if( isElement( value ) ) {
      throw new KaminoException();
    }
    if (typeof value == "object" && value) {
      originalClassName = getClass.call(value);
      if (originalClassName == "[object Date]" && !isProperty.call(value, "toJSON")) {
        if (value > -1 / 0 && value < 1 / 0) {
          value = value.toUTCString().replace("GMT", "UTC");
        } else {
          value = null;
        }
      } else if (typeof value.toJSON == "function" && ((originalClassName != "[object Number]" && originalClassName != "[object String]" && originalClassName != "[object Array]") || isProperty.call(value, "toJSON"))) {
        // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
        // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
        // ignores all `toJSON` methods on these objects unless they are
        // defined directly on an instance.
        value = value.toJSON(property);
      }
    }
    if (callback) {
      // If a replacement function was provided, call it to obtain the value
      // for serialization.
      value = callback.call(object, property, value);
    }
    if (value === null) {
      return "null";
    }
    if (value === undefined) {
      return undefined;
    }
    className = getClass.call(value);
    if (className == "[object Boolean]") {
      // Booleans are represented literally.
      return "" + value;
    } else if (className == "[object Number]") {
      // Kamino numbers must be finite. `Infinity` and `NaN` are serialized as
      // `"null"`.
      if( value === Number.POSITIVE_INFINITY ) {
        return "Infinity";
      } else if( value === Number.NEGATIVE_INFINITY ) {
        return "NInfinity";
      } else if( isNaN( value ) ) {
        return "NaN";
      }
      return "" + value;
    } else if (className == "[object RegExp]") {
      // Strings are double-quoted and escaped.
      regExpSource = value.source;
      regExpModifiers += value.ignoreCase ? "i" : "";
      regExpModifiers += value.global ? "g" : "";
      regExpModifiers += value.multiline ? "m" : "";

      regExpSource = quote(charIndexBuggy ? regExpSource.split("") : regExpSource);
      regExpModifiers = quote(charIndexBuggy ? regExpModifiers.split("") : regExpModifiers);

      // Adds the RegExp prefix.
      value = '^' + regExpSource + regExpModifiers;

      return value;
    } else if (className == "[object String]") {
      // Strings are double-quoted and escaped.
      value = quote(charIndexBuggy ? value.split("") : value);

      if( originalClassName == "[object Date]") {
        // Adds the Date prefix.
        value = '%' + value;
      }

      return value;
    }
    // Recursively serialize objects and arrays.
    if (typeof value == "object") {
      // Check for cyclic structures. This is a linear search; performance
      // is inversely proportional to the number of unique nested objects.
      for (length = stack.length; length--;) {
        if (stack[length] === value) {
          return "&" + length;
        }
      }
      // Add the object to the stack of traversed objects.
      stack.push(value);
      results = [];
      // Save the current indentation level and indent one additional level.
      prefix = indentation;
      indentation += whitespace;
      if (className == "[object Array]") {
        // Recursively serialize array elements.
        for (index = 0, length = value.length; index < length; any || (any = true), index++) {
          element = serialize(index, value, callback, properties, whitespace, indentation, stack);
          results.push(element === undef ? "null" : element);
        }
        result = any ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
      } else {
        // Recursively serialize object members. Members are selected from
        // either a user-specified list of property names, or the object
        // itself.
        forEach(properties || value, function (property) {
          var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
          if (element !== undef) {
            // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
            // is not the empty string, let `member` {quote(property) + ":"}
            // be the concatenation of `member` and the `space` character."
            // The "`space` character" refers to the literal space
            // character, not the `space` {width} argument provided to
            // `JSON.stringify`.
            results.push(quote(charIndexBuggy ? property.split("") : property) + ":" + (whitespace ? " " : "") + element);
          }
          any || (any = true);
        });
        result = any ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
      }
      return result;
    }
  };

  // Public: `Kamino.stringify`. See ES 5.1 section 15.12.3.
  Kamino.stringify = function (source, filter, width) {
    var whitespace, callback, properties;
    if (typeof filter == "function" || typeof filter == "object" && filter) {
      if (getClass.call(filter) == "[object Function]") {
        callback = filter;
      } else if (getClass.call(filter) == "[object Array]") {
        // Convert the property names array into a makeshift set.
        properties = {};
        for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((getClass.call(value) == "[object String]" || getClass.call(value) == "[object Number]") && (properties[value] = 1)));
      }
    }
    if (width) {
      if (getClass.call(width) == "[object Number]") {
        // Convert the `width` to an integer and create a string containing
        // `width` number of space characters.
        if ((width -= width % 1) > 0) {
          for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
        }
      } else if (getClass.call(width) == "[object String]") {
        whitespace = width.length <= 10 ? width : width.slice(0, 10);
      }
    }
    // Opera <= 7.54u2 discards the values associated with empty string keys
    // (`""`) only if they are used directly within an object member list
    // (e.g., `!("" in { "": 1})`).
    return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
  };

  // Public: Parses a source string.
  var fromCharCode = String.fromCharCode;

  // Internal: A map of escaped control characters and their unescaped
  // equivalents.
  var Unescapes = {
    "\\": "\\",
    '"': '"',
    "/": "/",
    "b": "\b",
    "t": "\t",
    "n": "\n",
    "f": "\f",
    "r": "\r"
  };

  // Internal: Stores the parser state.
  var Index, Source, stack;

  // Internal: Resets the parser state and throws a `SyntaxError`.
  var abort = function() {
    Index = Source = null;
    throw SyntaxError();
  };

  var parseString = function(prefix) {
    prefix = prefix || "";
    var source = Source, length = source.length, value, symbol, begin, position;
    // Advance to the next character and parse a Kamino string at the
    // current position. String tokens are prefixed with the sentinel
    // `@` character to distinguish them from punctuators.
    for (value = prefix, Index++; Index < length;) {
      symbol = source[Index];
      if (symbol < " ") {
        // Unescaped ASCII control characters are not permitted.
        abort();
      } else if (symbol == "\\") {
        // Parse escaped Kamino control characters, `"`, `\`, `/`, and
        // Unicode escape sequences.
        symbol = source[++Index];
        if ('\\"/btnfr'.indexOf(symbol) > -1) {
          // Revive escaped control characters.
          value += Unescapes[symbol];
          Index++;
        } else if (symbol == "u") {
          // Advance to the first character of the escape sequence.
          begin = ++Index;
          // Validate the Unicode escape sequence.
          for (position = Index + 4; Index < position; Index++) {
            symbol = source[Index];
            // A valid sequence comprises four hexdigits that form a
            // single hexadecimal value.
            if (!(symbol >= "0" && symbol <= "9" || symbol >= "a" && symbol <= "f" || symbol >= "A" && symbol <= "F")) {
              // Invalid Unicode escape sequence.
              abort();
            }
          }
          // Revive the escaped character.
          value += fromCharCode("0x" + source.slice(begin, Index));
        } else {
          // Invalid escape sequence.
          abort();
        }
      } else {
        if (symbol == '"') {
          // An unescaped double-quote character marks the end of the
          // string.
          break;
        }
        // Append the original character as-is.
        value += symbol;
        Index++;
      }
    }
    if (source[Index] == '"') {
      Index++;
      // Return the revived string.
      return value;
    }
    // Unterminated string.
    abort();
  };

  // Internal: Returns the next token, or `"$"` if the parser has reached
  // the end of the source string. A token may be a string, number, `null`
  // literal, `NaN` literal or Boolean literal.
  var lex = function () {
    var source = Source, length = source.length, symbol, value, begin, position, sign,
        dateString, regExpSource, regExpModifiers;
    while (Index < length) {
      symbol = source[Index];
      if ("\t\r\n ".indexOf(symbol) > -1) {
        // Skip whitespace tokens, including tabs, carriage returns, line
        // feeds, and space characters.
        Index++;
      } else if ("{}[]:,".indexOf(symbol) > -1) {
        // Parse a punctuator token at the current position.
        Index++;
        return symbol;
      } else if (symbol == '"') {
        // Parse strings.
        return parseString("@");
      } else if (symbol == '%') {
        // Parse dates.
        Index++;
        symbol = source[Index];
        if(symbol == '"') {
          dateString = parseString();
          return new Date( dateString );
        }
        abort();
      } else if (symbol == '^') {
        // Parse regular expressions.
        Index++;
        symbol = source[Index];
        if(symbol == '"') {
          regExpSource = parseString();

          symbol = source[Index];
          if(symbol == '"') {
            regExpModifiers = parseString();

            return new RegExp( regExpSource, regExpModifiers );
          }
        }
        abort();
      } else if (symbol == '&') {
        // Parse object references.
        Index++;
        symbol = source[Index];
        if (symbol >= "0" && symbol <= "9") {
          Index++;
          return stack[symbol];
        }
        abort();
      } else {
        // Parse numbers and literals.
        begin = Index;
        // Advance the scanner's position past the sign, if one is
        // specified.
        if (symbol == "-") {
          sign = true;
          symbol = source[++Index];
        }
        // Parse an integer or floating-point value.
        if (symbol >= "0" && symbol <= "9") {
          // Leading zeroes are interpreted as octal literals.
          if (symbol == "0" && (symbol = source[Index + 1], symbol >= "0" && symbol <= "9")) {
            // Illegal octal literal.
            abort();
          }
          sign = false;
          // Parse the integer component.
          for (; Index < length && (symbol = source[Index], symbol >= "0" && symbol <= "9"); Index++);
          // Floats cannot contain a leading decimal point; however, this
          // case is already accounted for by the parser.
          if (source[Index] == ".") {
            position = ++Index;
            // Parse the decimal component.
            for (; position < length && (symbol = source[position], symbol >= "0" && symbol <= "9"); position++);
            if (position == Index) {
              // Illegal trailing decimal.
              abort();
            }
            Index = position;
          }
          // Parse exponents.
          symbol = source[Index];
          if (symbol == "e" || symbol == "E") {
            // Skip past the sign following the exponent, if one is
            // specified.
            symbol = source[++Index];
            if (symbol == "+" || symbol == "-") {
              Index++;
            }
            // Parse the exponential component.
            for (position = Index; position < length && (symbol = source[position], symbol >= "0" && symbol <= "9"); position++);
            if (position == Index) {
              // Illegal empty exponent.
              abort();
            }
            Index = position;
          }
          // Coerce the parsed value to a JavaScript number.
          return +source.slice(begin, Index);
        }
        // A negative sign may only precede numbers.
        if (sign) {
          abort();
        }
        // `true`, `false`, `Infinity`, `-Infinity`, `NaN` and `null` literals.
        if (source.slice(Index, Index + 4) == "true") {
          Index += 4;
          return true;
        } else if (source.slice(Index, Index + 5) == "false") {
          Index += 5;
          return false;
        } else if (source.slice(Index, Index + 8) == "Infinity") {
          Index += 8;
          return Infinity;
        } else if (source.slice(Index, Index + 9) == "NInfinity") {
          Index += 9;
          return -Infinity;
        } else if (source.slice(Index, Index + 3) == "NaN") {
          Index += 3;
          return NaN;
        } else if (source.slice(Index, Index + 4) == "null") {
          Index += 4;
          return null;
        }
        // Unrecognized token.
        abort();
      }
    }
    // Return the sentinel `$` character if the parser has reached the end
    // of the source string.
    return "$";
  };

  // Internal: Parses a Kamino `value` token.
  var get = function (value) {
    var results, any, key;
    if (value == "$") {
      // Unexpected end of input.
      abort();
    }
    if (typeof value == "string") {
      if (value[0] == "@") {
        // Remove the sentinel `@` character.
        return value.slice(1);
      }
      // Parse object and array literals.
      if (value == "[") {
        // Parses a Kamino array, returning a new JavaScript array.
        results = [];
        stack[stack.length] = results;
        for (;; any || (any = true)) {
          value = lex();
          // A closing square bracket marks the end of the array literal.
          if (value == "]") {
            break;
          }
          // If the array literal contains elements, the current token
          // should be a comma separating the previous element from the
          // next.
          if (any) {
            if (value == ",") {
              value = lex();
              if (value == "]") {
                // Unexpected trailing `,` in array literal.
                abort();
              }
            } else {
              // A `,` must separate each array element.
              abort();
            }
          }
          // Elisions and leading commas are not permitted.
          if (value == ",") {
            abort();
          }
          results.push(get(typeof value == "string" && charIndexBuggy ? value.split("") : value));
        }
        return results;
      } else if (value == "{") {
        // Parses a Kamino object, returning a new JavaScript object.
        results = {};
        stack[stack.length] = results;
        for (;; any || (any = true)) {
          value = lex();
          // A closing curly brace marks the end of the object literal.
          if (value == "}") {
            break;
          }
          // If the object literal contains members, the current token
          // should be a comma separator.
          if (any) {
            if (value == ",") {
              value = lex();
              if (value == "}") {
                // Unexpected trailing `,` in object literal.
                abort();
              }
            } else {
              // A `,` must separate each object member.
              abort();
            }
          }
          // Leading commas are not permitted, object property names must be
          // double-quoted strings, and a `:` must separate each property
          // name and value.
          if (value == "," || typeof value != "string" || value[0] != "@" || lex() != ":") {
            abort();
          }
          var result = lex();
          results[value.slice(1)] = get(typeof result == "string" && charIndexBuggy ? result.split("") : result);
        }
        return results;
      }
      // Unexpected token encountered.
      abort();
    }
    return value;
  };

  // Internal: Updates a traversed object member.
  var update = function(source, property, callback) {
    var element = walk(source, property, callback);
    if (element === undef) {
      delete source[property];
    } else {
      source[property] = element;
    }
  };

  // Internal: Recursively traverses a parsed Kamino object, invoking the
  // `callback` function for each value. This is an implementation of the
  // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
  var walk = function (source, property, callback) {
    var value = source[property], length;
    if (typeof value == "object" && value) {
      if (getClass.call(value) == "[object Array]") {
        for (length = value.length; length--;) {
          update(value, length, callback);
        }
      } else {
        // `forEach` can't be used to traverse an array in Opera <= 8.54,
        // as `Object#hasOwnProperty` returns `false` for array indices
        // (e.g., `![1, 2, 3].hasOwnProperty("0")`).
        forEach(value, function (property) {
          update(value, property, callback);
        });
      }
    }
    return callback.call(source, property, value);
  };

  // Public: `Kamino.parse`. See ES 5.1 section 15.12.2.
  Kamino.parse = function (source, callback) {
    var result, value;
    Index = 0;
    Source = "" + source;
    stack = [];
    if (charIndexBuggy) {
      Source = source.split("");
    }
    result = get(lex());
    // If a Kamino string contains multiple tokens, it is invalid.
    if (lex() != "$") {
      abort();
    }
    // Reset the parser state.
    Index = Source = null;
    return callback && getClass.call(callback) == "[object Function]" ? walk((value = {}, value[""] = result, value), "", callback) : result;
  };

  Kamino.clone = function(source) {
    return Kamino.parse( Kamino.stringify(source) );
  };
})(this);

(function(root) {
  var self = root,
      Window = self.Window,
      usePoly = false,
      a_slice = [].slice;

  if( usePoly || !self.MessageChannel ) {

    var isWindowToWindowMessage = function( currentTarget ) {
          return typeof window !== "undefined" && self instanceof Window && ( !self.Worker || !(currentTarget instanceof Worker) );
        },
        log = function( message ) {
          if (MessageChannel.verbose) {
            var args = a_slice.apply(arguments);
            args.unshift("MCNP: ");
            console.log.apply(console, args);
          }
        },
        messagePorts = {};

    var MessagePort = self.MessagePort = function( uuid ) {
      this._entangledPortUuid = null;
      this.destinationUrl = null;
      this._listeners = {};
      this._messageQueue = [],
      this._messageQueueEnabled = false,
      this._currentTarget = null;

      this.uuid = uuid || UUID.generate();
      messagePorts[this.uuid] = this;
      this.log("created");
    };

    MessagePort.prototype = {
      start: function() {
        var event,
            self = this;

        // TODO: we have no guarantee that
        // we will not receive and process events in the correct order
        setTimeout( function() {
          self.log('draining ' + self._messageQueue.length + ' queued messages');
          while( self._messageQueueEnabled && (event = self._messageQueue.shift()) ) {
            self.dispatchEvent( event );
          }
        });
        this._messageQueueEnabled = true;
        this.log('started');
      },

      close: function() {
        this._messageQueueEnabled = false;
        if( this._entangledPortUuid ) {
          this._getEntangledPort()._entangledPortUuid = null;
          this._entangledPortUuid = null;

          // /!\ Probably need to send that (?)
        }
      },

      postMessage: function( message ) {
        // Numbers refer to step from the W3C specs. It shows how simplified things are
        // 1- Let target port be the port with which source port is entangled, if any
        var target = this._getEntangledPort(),
            currentTarget = this._currentTarget,
            messageClone;


        // 5- Let message clone be the result of obtaining a structured clone of the message argument
        messageClone = MessageChannel.encodeEvent( message, [target], true );

        // 8- If there is no target port (i.e. if source port is not entangled), then abort these steps.
        if(!target) {
          this.log("not entangled, discarding message", message);
          return;
        }

        // 12- Add the event to the port message queue of target port.
        // As the port is cloned when sent to the other user agent,
        // posting a message can mean different things:
        // * The port is still local, then we need to queue the event
        // * the port has been sent, then we need to send that event
        if( currentTarget ) {
          if( isWindowToWindowMessage( currentTarget ) ) {
            this.log("posting message from window to window", message, this.destinationUrl);
            currentTarget.postMessage(messageClone, this.destinationUrl);
          } else {
            this.log("posting message from or to worker", message);
            currentTarget.postMessage(messageClone);
          }
        } else {
          this.log("not connected, queueing message", message);
          target._messageQueue.push( messageClone );
        }
      },

      addEventListener: function( type, listener ) {
        if (typeof this._listeners[type] === "undefined"){
          this._listeners[type] = [];
        }

        this._listeners[type].push( listener );
      },

      removeEventListener: function( type, listener) {
        if (this._listeners[type] instanceof Array){
          var listeners = this._listeners[type];
          for (var i=0; i < listeners.length; i++){
            if (listeners[i] === listener){
              listeners.splice(i, 1);
              break;
            }
          }
        }
      },

      dispatchEvent: function( event ) {
        var listeners = this._listeners.message;
        if( listeners ) {
          for (var i=0; i < listeners.length; i++){
            listeners[i].call(this, event);
          }
        }
      },

      _enqueueEvent: function( event ) {
        if(this._messageQueueEnabled) {
          this.dispatchEvent( event );
        } else {
          this._messageQueue.push( event );
        }
      },

      _getPort: function( portClone, messageEvent, copyEvents ) {
        var loadPort = function(uuid) {
          var port = messagePorts[uuid] || MessageChannel._createPort(uuid);
          return port;
        };

        var port = loadPort(portClone.uuid);
        port._entangledPortUuid = portClone._entangledPortUuid;
        port._getEntangledPort()._entangledPortUuid = port.uuid;
        port._currentTarget =  messageEvent.source || messageEvent.currentTarget || self;
        if( messageEvent.origin === "null" ) {
          port.destinationUrl = "*";
        } else {
          port.destinationUrl = messageEvent.origin;
        }

        if( copyEvents ) {
          for( var i=0 ; i < portClone._messageQueue.length ; i++ ) {
            port._messageQueue.push( Kamino.parse( portClone._messageQueue[i] ).event );
          }
        }

        return port;
      },

      _getEntangledPort: function() {
        if( this._entangledPortUuid ) {
          return messagePorts[ this._entangledPortUuid ] || MessageChannel._createPort(this._entangledPortUuid);
        } else {
          return null;
        }
      },

      log: function () {
        if (MessageChannel.verbose) {
          var args = a_slice.apply(arguments);
          args.unshift("Port", this.uuid);
          log.apply(null, args);
        }
      }
    };

    var MessageChannel = self.MessageChannel = function () {
      var port1 = MessageChannel._createPort(),
          port2 = MessageChannel._createPort(),
          channel;

      port1._entangledPortUuid = port2.uuid;
      port2._entangledPortUuid = port1.uuid;

      channel = {
        port1: port1,
        port2: port2
      };

      MessageChannel.log(channel, "created");

      return channel;
    };

    MessageChannel.log = function (_channel) {
      if (MessageChannel.verbose) {
        var args = ["Chnl"],
            msgArgs = a_slice.call(arguments, 1);

        if (_channel.port1 && _channel.port2) {
          args.push(_channel.port1.uuid, _channel.port2.uuid);
        } else {
          _channel.forEach( function(channel) {
            args.push(channel._entangledPortUuid);
          });
        }

        args.push.apply(args, msgArgs);
        log.apply(null, args);
      }
    };

    MessageChannel._createPort = function() {
      var args = arguments,
          MessagePortConstructor = function() {
            return MessagePort.apply(this, args);
          };

      MessagePortConstructor.prototype = MessagePort.prototype;

      return new MessagePortConstructor();
    };

    /**
        Encode the event to be sent.

        messageEvent.data contains a fake Event encoded with Kamino.js

        It contains:
        * data: the content that the MessagePort should send
        * ports: The targeted MessagePorts.
        * messageChannel: this allows to decide if the MessageEvent was meant for the window or the port

        @param {Object} data
        @param {Array} ports
        @param {Boolean} messageChannel
        @returns {String} a string representation of the data to be sent
    */
    MessageChannel.encodeEvent = function( data, ports, messageChannel ) {
      var currentTargets,
          port, index,
          encodedMessage;

      if( ports && ports.length ) {
        currentTargets = [];

        for(index=0 ; index < ports.length ; index++) {
          port = ports[index];

          if( port ) {
            currentTargets[index] = port._currentTarget;
            delete port._currentTarget;
          }
        }
      }

      encodedMessage = Kamino.stringify( {event: {data: data, ports: ports, messageChannel: messageChannel}} );

      if (currentTargets) {
        for(index=0 ; index < currentTargets.length ; index++) {
          if( currentTargets[index] ) {
            ports[index]._currentTarget = currentTargets[index];
          }
        }
      }

      return encodedMessage;
    };

    /**
        Extract the event from the message.

        messageEvent.data contains a fake Event encoded with Kamino.js

        It contains:
        * data: the content that the MessagePort should use
        * ports: The targeted MessagePorts.
        * messageChannel: this allows to decide if the MessageEvent was meant for the window or the port

        @param {MessageEvent} messageEvent
        @param {Boolean} copyEvents: copy or not the events from the cloned port to the local one
        @returns {Object} an object that fakes an event with limited attributes ( data, ports )
    */
    MessageChannel.decodeEvent = function( messageEvent, copyEvents ) {
      var fakeEvent = {
            data: null,
            ports: []
          },
          data = Kamino.parse( messageEvent.data ),
          event = data.event,
          ports = event.ports;

      if( event ) {
        if( ports ) {
          for(var i=0; i< ports.length ; i++) {
            fakeEvent.ports.push( MessagePort.prototype._getPort( ports[i], messageEvent, copyEvents ) );
          }
        }
        fakeEvent.data = event.data;
        fakeEvent.messageChannel = event.messageChannel;
      }

      return fakeEvent;
    };

    /**
        Extract the event from the message if possible.

        A user agent can received events that are not encoded using Kamino.

        @param {MessageEvent} messageEvent
        @param {Boolean} copyEvents: copy or not the events from the cloned port to the local one
        @returns {Object} an object that fakes an event or the triggered event
    */
    var decodeEvent = function( event, copyEvents ) {
      var messageEvent;

      try {
        messageEvent = MessageChannel.decodeEvent( event, copyEvents );
      } catch( e ) {
        if( e instanceof SyntaxError ) {
          messageEvent = event;
        } else {
          throw e;
        }
      }

      return messageEvent;
    };

    var propagationHandler = function( event ) {
      var messageEvent = decodeEvent( event, true );

      if( messageEvent.messageChannel ) {
        MessageChannel.propagateEvent( messageEvent );
      }
    };

    // Add the default message event handler
    // This is useful so that a user agent can pass ports
    // without declaring any event handler.
    //
    // This handler takes care of copying the events queue passed with a port.
    // We only need to perform this when passing a port between user agents,
    // otherwise the event is passed through `postMessage` and not through the queue
    // and is handled by the port's message listener.
    //
    // Ex:
    //    iFrame1 - iFrame2 - iFrame3
    //    iFrame2 creates a MessageChannel and passes a port to each iframe
    //    we need a default handler to receive MessagePorts' events
    //    and to propagate them
    var _addMessagePortEventHandler = function( target ) {
      if( target.addEventListener ) {
        target.addEventListener( 'message', propagationHandler, false );
      } else if( target.attachEvent ) {
        target.attachEvent( 'onmessage', propagationHandler );
      }
    };

    var _overrideMessageEventListener = function( target ) {
      var originalAddEventListener, addEventListenerName,
          targetRemoveEventListener, removeEventListenerName,
          messageEventType,
          messageHandlers = [];

      if( target.addEventListener ) {
        originalAddEventListener = target.addEventListener;
        addEventListenerName = 'addEventListener';
        targetRemoveEventListener = target.removeEventListener;
        removeEventListenerName = 'removeEventListener';
        messageEventType = 'message';
      } else if( target.attachEvent ) {
        originalAddEventListener = target.attachEvent;
        addEventListenerName = 'attachEvent';
        targetRemoveEventListener = target.detachEvent;
        removeEventListenerName = 'detachEvent';
        messageEventType = 'onmessage';
      }

      target[addEventListenerName] = function() {
        var args = Array.prototype.slice.call( arguments ),
            originalHandler = args[1],
            self = this,
            messageHandlerWrapper;

        if( args[0] === messageEventType ) {
          messageHandlerWrapper = function( event ) {
            var messageEvent = decodeEvent( event );

            if( ! messageEvent.messageChannel ) {
              originalHandler.call( self, messageEvent );
            }
          };
          originalHandler.messageHandlerWrapper = messageHandlerWrapper;

          args[1] = messageHandlerWrapper;
        }

        originalAddEventListener.apply( this, args );
      };

      target[removeEventListenerName] = function() {
        var args = Array.prototype.slice.call( arguments ),
            originalHandler = args[1];

        if( args[0] === messageEventType ) {
          args[1] = originalHandler.messageHandlerWrapper;
          delete originalHandler.messageHandlerWrapper;
        }

        if( args[1] ) {
          targetRemoveEventListener.apply( this, args );
        }
      };
    };


    /**
        Send the event to the targeted ports

        It uses the `messageChannel` attribute to decide
        if the event is meant for the window or MessagePorts

        @param {Object} fakeEvent
    */
    MessageChannel.propagateEvent = function( fakeEvent ) {
      var ports, port, entangledPort;

      if( fakeEvent.messageChannel ) {
        ports = fakeEvent.ports;

        for( var i=0 ; i<ports.length ; i++) {
          port = ports[i];
          entangledPort = port._getEntangledPort();

          if( port._currentTarget && entangledPort._currentTarget ) {
            entangledPort.postMessage( fakeEvent.data );
          } else {
            port._enqueueEvent( fakeEvent );
          }
        }
      }
    };

    MessageChannel.reset = function() {
      messagePorts = {};
    };

    //
    _addMessagePortEventHandler( self );

    /**
        Send the MessagePorts to the other window

        `window.postMessage` doesn't accept fake ports so we have to encode them
        and pass them in the message.

        @param {Object} otherWindow: A reference to another window.
        @param {Object} message: Data to be sent to the other window.
        @param {String} targetOrigin: Specifies what the origin of otherWindow must be for the event to be dispatched.
        @param {Array} ports: MessagePorts that need to be sent to otherWindow.
    */
    if( Window ) {
      Window.postMessage = function( otherWindow, message, targetOrigin, ports ) {
        var data, entangledPort;

        // Internet Explorer requires the `ports` parameter
        ports = ports || [];

        data = MessageChannel.encodeEvent( message, ports, false );

        if( ports ) {
          // We need to know if a port has been sent to another user agent
          // to decide when to queue and when to send messages
          // See `MessageChannel.propagateEvent`
          for( var i=0 ; i<ports.length ; i++) {
            entangledPort = ports[i]._getEntangledPort();
            if( !entangledPort._currentTarget ) {
              entangledPort._currentTarget = otherWindow;
              entangledPort.destinationUrl = targetOrigin;
            }
          }
        }

        MessageChannel.log(ports, "handshake window", otherWindow);
        otherWindow.postMessage(data, targetOrigin);
      };

      _overrideMessageEventListener( Window.prototype );
    } else {
      //Worker
      _overrideMessageEventListener( self );
    }

    if( self.Worker ) {
      var OriginalWorker = Worker,
          originalAddEventListener;

      if( OriginalWorker.prototype.addEventListener ) {
        originalAddEventListener = OriginalWorker.prototype.addEventListener;
      } else if( OriginalWorker.prototype.attachEvent ) {
        originalAddEventListener = OriginalWorker.prototype.attachEvent;
      }

      self.Worker = function() {
        var worker = new OriginalWorker(arguments[0]),
            _addEventListener = originalAddEventListener;

        _addEventListener.call(worker, 'message', propagationHandler);

        return worker;
      };
      Worker.prototype = OriginalWorker.prototype;

      _overrideMessageEventListener( Worker.prototype );

      Worker.postMessage = function( worker, message, transferList )  {
        var data = MessageChannel.encodeEvent( message, transferList, false ),
            entangledPort;

        for( var i=0 ; i<transferList.length ; i++) {
          entangledPort = transferList[i]._getEntangledPort();
          entangledPort._currentTarget = worker;
        }

        MessageChannel.log(transferList, "handshake worker", worker);
        worker.postMessage( data );
      };
    }
  } else {
    if( Window ) {
      Window.postMessage = function( source, message, targetOrigin, ports ) {
        // Internet Explorer requires the `ports` parameter
        ports = ports || [];
        source.postMessage( message, targetOrigin, ports );
      };
    } else {
      // Web worker
      self.Worker = {
        postMessage: function( worker, message, transferList ) {
          worker.postMessage( message, transferList );
        }
      };
    }

    if( self.Worker ) {
      self.Worker.postMessage = function( worker, message, transferList )  {
        worker.postMessage( message, transferList);
      };
    }
  }
})(this);

define("rsvp/all",
  ["rsvp/defer","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var defer = __dependency1__.defer;

    function all(promises) {
      var results = [], deferred = defer(), remaining = promises.length;

      if (remaining === 0) {
        deferred.resolve([]);
      }

      var resolver = function(index) {
        return function(value) {
          resolveAll(index, value);
        };
      };

      var resolveAll = function(index, value) {
        results[index] = value;
        if (--remaining === 0) {
          deferred.resolve(results);
        }
      };

      var rejectAll = function(error) {
        deferred.reject(error);
      };

      for (var i = 0; i < promises.length; i++) {
        if (promises[i] && typeof promises[i].then === 'function') {
          promises[i].then(resolver(i), rejectAll);
        } else {
          resolveAll(i, promises[i]);
        }
      }
      return deferred.promise;
    }

    __exports__.all = all;
  });

define("rsvp/async",
  ["exports"],
  function(__exports__) {
    "use strict";
    var browserGlobal = (typeof window !== 'undefined') ? window : {};

    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    var async;

    if (typeof process !== 'undefined' &&
      {}.toString.call(process) === '[object process]') {
      async = function(callback, binding) {
        process.nextTick(function() {
          callback.call(binding);
        });
      };
    } else if (BrowserMutationObserver) {
      var queue = [];

      var observer = new BrowserMutationObserver(function() {
        var toProcess = queue.slice();
        queue = [];

        toProcess.forEach(function(tuple) {
          var callback = tuple[0], binding = tuple[1];
          callback.call(binding);
        });
      });

      var element = document.createElement('div');
      observer.observe(element, { attributes: true });

      // Chrome Memory Leak: https://bugs.webkit.org/show_bug.cgi?id=93661
      window.addEventListener('unload', function(){
        observer.disconnect();
        observer = null;
      });

      async = function(callback, binding) {
        queue.push([callback, binding]);
        element.setAttribute('drainQueue', 'drainQueue');
      };
    } else {
      async = function(callback, binding) {
        setTimeout(function() {
          callback.call(binding);
        }, 1);
      };
    }


    __exports__.async = async;
  });

define("rsvp/config",
  ["rsvp/async","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var async = __dependency1__.async;

    var config = {};
    config.async = async;

    __exports__.config = config;
  });

define("rsvp/defer",
  ["rsvp/promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Promise = __dependency1__.Promise;

    function defer() {
      var deferred = {};

      var promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
      });

      deferred.promise = promise;
      return deferred;
    }

    __exports__.defer = defer;
  });

define("rsvp/events",
  ["exports"],
  function(__exports__) {
    "use strict";
    var Event = function(type, options) {
      this.type = type;

      for (var option in options) {
        if (!options.hasOwnProperty(option)) { continue; }

        this[option] = options[option];
      }
    };

    var indexOf = function(callbacks, callback) {
      for (var i=0, l=callbacks.length; i<l; i++) {
        if (callbacks[i][0] === callback) { return i; }
      }

      return -1;
    };

    var callbacksFor = function(object) {
      var callbacks = object._promiseCallbacks;

      if (!callbacks) {
        callbacks = object._promiseCallbacks = {};
      }

      return callbacks;
    };

    var EventTarget = {
      mixin: function(object) {
        object.on = this.on;
        object.off = this.off;
        object.trigger = this.trigger;
        return object;
      },

      on: function(eventNames, callback, binding) {
        var allCallbacks = callbacksFor(this), callbacks, eventName;
        eventNames = eventNames.split(/\s+/);
        binding = binding || this;

        while (eventName = eventNames.shift()) {
          callbacks = allCallbacks[eventName];

          if (!callbacks) {
            callbacks = allCallbacks[eventName] = [];
          }

          if (indexOf(callbacks, callback) === -1) {
            callbacks.push([callback, binding]);
          }
        }
      },

      off: function(eventNames, callback) {
        var allCallbacks = callbacksFor(this), callbacks, eventName, index;
        eventNames = eventNames.split(/\s+/);

        while (eventName = eventNames.shift()) {
          if (!callback) {
            allCallbacks[eventName] = [];
            continue;
          }

          callbacks = allCallbacks[eventName];

          index = indexOf(callbacks, callback);

          if (index !== -1) { callbacks.splice(index, 1); }
        }
      },

      trigger: function(eventName, options) {
        var allCallbacks = callbacksFor(this),
            callbacks, callbackTuple, callback, binding, event;

        if (callbacks = allCallbacks[eventName]) {
          // Don't cache the callbacks.length since it may grow
          for (var i=0; i<callbacks.length; i++) {
            callbackTuple = callbacks[i];
            callback = callbackTuple[0];
            binding = callbackTuple[1];

            if (typeof options !== 'object') {
              options = { detail: options };
            }

            event = new Event(eventName, options);
            callback.call(binding, event);
          }
        }
      }
    };


    __exports__.EventTarget = EventTarget;
  });

define("rsvp/hash",
  ["rsvp/defer","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var defer = __dependency1__.defer;

    function size(object) {
      var size = 0;

      for (var prop in object) {
        size++;
      }

      return size;
    }

    function hash(promises) {
      var results = {}, deferred = defer(), remaining = size(promises);

      if (remaining === 0) {
        deferred.resolve({});
      }

      var resolver = function(prop) {
        return function(value) {
          resolveAll(prop, value);
        };
      };

      var resolveAll = function(prop, value) {
        results[prop] = value;
        if (--remaining === 0) {
          deferred.resolve(results);
        }
      };

      var rejectAll = function(error) {
        deferred.reject(error);
      };

      for (var prop in promises) {
        if (promises[prop] && typeof promises[prop].then === 'function') {
          promises[prop].then(resolver(prop), rejectAll);
        } else {
          resolveAll(prop, promises[prop]);
        }
      }

      return deferred.promise;
    }

    __exports__.hash = hash;
  });

define("rsvp/node",
  ["rsvp/promise","rsvp/all","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Promise = __dependency1__.Promise;
    var all = __dependency2__.all;

    function makeNodeCallbackFor(resolve, reject) {
      return function (error, value) {
        if (error) {
          reject(error);
        } else if (arguments.length > 2) {
          resolve(Array.prototype.slice.call(arguments, 1));
        } else {
          resolve(value);
        }
      };
    }

    function denodeify(nodeFunc) {
      return function()  {
        var nodeArgs = Array.prototype.slice.call(arguments), resolve, reject;

        var promise = new Promise(function(nodeResolve, nodeReject) {
          resolve = nodeResolve;
          reject = nodeReject;
        });

        all(nodeArgs).then(function(nodeArgs) {
          nodeArgs.push(makeNodeCallbackFor(resolve, reject));

          try {
            nodeFunc.apply(this, nodeArgs);
          } catch(e) {
            reject(e);
          }
        });

        return promise;
      };
    }

    __exports__.denodeify = denodeify;
  });

define("rsvp/promise",
  ["rsvp/config","rsvp/events","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var config = __dependency1__.config;
    var EventTarget = __dependency2__.EventTarget;

    var noop = function() {};

    var Promise = function(resolver) {
      var promise = this,
      resolved = false;

      if (typeof resolver !== 'function') {
        throw new TypeError('You must pass a resolver function as the sole argument to the promise constructor');
      }

      if (!(promise instanceof Promise)) {
        return new Promise(resolver);
      }

      var resolvePromise = function(value) {
        if (resolved) { return; }
        resolved = true;
        resolve(promise, value);
      };

      var rejectPromise = function(value) {
        if (resolved) { return; }
        resolved = true;
        reject(promise, value);
      };

      this.on('promise:resolved', function(event) {
        this.trigger('success', { detail: event.detail });
      }, this);

      this.on('promise:failed', function(event) {
        this.trigger('error', { detail: event.detail });
      }, this);

      resolver(resolvePromise, rejectPromise);
    };

    var invokeCallback = function(type, promise, callback, event) {
      var hasCallback = typeof callback === 'function',
          value, error, succeeded, failed;

      if (hasCallback) {
        try {
          value = callback(event.detail);
          succeeded = true;
        } catch(e) {
          failed = true;
          error = e;
        }
      } else {
        value = event.detail;
        succeeded = true;
      }

      if (value && typeof value.then === 'function') {
        value.then(function(value) {
          resolve(promise, value);
        }, function(error) {
          reject(promise, error);
        });
      } else if (hasCallback && succeeded) {
        resolve(promise, value);
      } else if (failed) {
        reject(promise, error);
      } else if (type === 'resolve') {
        resolve(promise, value);
      } else if (type === 'reject') {
        reject(promise, value);
      }
    };

    Promise.prototype = {
      constructor: Promise,

      then: function(done, fail) {
        var thenPromise = new Promise(function() {});

        if (this.isFulfilled) {
          config.async(function() {
            invokeCallback('resolve', thenPromise, done, { detail: this.fulfillmentValue });
          }, this);
        }

        if (this.isRejected) {
          config.async(function() {
            invokeCallback('reject', thenPromise, fail, { detail: this.rejectedReason });
          }, this);
        }

        this.on('promise:resolved', function(event) {
          invokeCallback('resolve', thenPromise, done, event);
        });

        this.on('promise:failed', function(event) {
          invokeCallback('reject', thenPromise, fail, event);
        });

        return thenPromise;
      }
    };

    EventTarget.mixin(Promise.prototype);

    function resolve(promise, value) {
      if (value && typeof value.then === 'function') {
        value.then(function(val) {
          resolve(promise, val);
        }, function(val) {
          reject(promise, val);
        });
      } else {
        fulfill(promise, value);
      }
    }

    function fulfill(promise, value) {
      config.async(function() {
        promise.trigger('promise:resolved', { detail: value });
        promise.isFulfilled = true;
        promise.fulfillmentValue = value;
      });
    }

    function reject(promise, value) {
      config.async(function() {
        promise.trigger('promise:failed', { detail: value });
        promise.isRejected = true;
        promise.rejectedReason = value;
      });
    }


    __exports__.Promise = Promise;
  });

define("rsvp/resolve",
  ["rsvp/promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Promise = __dependency1__.Promise;


    function objectOrFunction(x) {
      return typeof x === "function" || (typeof x === "object" && x !== null);
    }

    function resolve(thenable){
      var promise = new Promise(function(resolve, reject){
        var then;

        try {
          if ( objectOrFunction(thenable) ) {
            then = thenable.then;

            if (typeof then === "function") {
              then.call(thenable, resolve, reject);
            } else {
              resolve(thenable);
            }

          } else {
            resolve(thenable);
          }

        } catch(error) {
          reject(error);
        }
      });

      return promise;
    }


    __exports__.resolve = resolve;
  });

define("rsvp",
  ["rsvp/events","rsvp/promise","rsvp/node","rsvp/all","rsvp/hash","rsvp/defer","rsvp/config","rsvp/resolve","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var EventTarget = __dependency1__.EventTarget;
    var Promise = __dependency2__.Promise;
    var denodeify = __dependency3__.denodeify;
    var all = __dependency4__.all;
    var hash = __dependency5__.hash;
    var defer = __dependency6__.defer;
    var config = __dependency7__.config;
    var resolve = __dependency8__.resolve;

    function configure(name, value) {
      config[name] = value;
    }


    __exports__.Promise = Promise;
    __exports__.EventTarget = EventTarget;
    __exports__.all = all;
    __exports__.hash = hash;
    __exports__.defer = defer;
    __exports__.denodeify = denodeify;
    __exports__.configure = configure;
    __exports__.resolve = resolve;
  });

define("oasis",
  ["oasis/util", "oasis/connect", "rsvp", "oasis/logger", "oasis/state", "oasis/config", "oasis/sandbox", "oasis/sandbox_init", "oasis/service", "oasis/iframe_adapter", "oasis/webworker_adapter"],
  function(__dependency1__, __dependency2__, RSVP, Logger, State, configuration, Sandbox, initializeSandbox, Service, iframeAdapter, webworkerAdapter) {
    "use strict";
    var assert = __dependency1__.assert;
    var verifySandbox = __dependency1__.verifySandbox;
    var registerHandler = __dependency2__.registerHandler;
    var connect = __dependency2__.connect;
    var portFor = __dependency2__.portFor;



    var Oasis = {};

    //Logger.enable();

    //verifySandbox();

    Oasis.adapters = {
      iframe: iframeAdapter,
      webworker: webworkerAdapter
    };


    /**
      This is the entry point that allows the containing environment to create a
      child sandbox.

      Options:

      * `capabilities`: an array of registered services
      * `url`: a registered URL to a JavaScript file that will initialize the
        sandbox in the sandboxed environment
      * `adapter`: a reference to an adapter that will handle the lifecycle
        of the sandbox. Right now, there are iframe and web worker adapters.

      @param {Object} options
    */
    Oasis.createSandbox = function(options) {
      return new Sandbox(options);
    };

    Oasis.Service = Oasis.Consumer = Service;

    var packages = State.packages;
    Oasis.reset = function() {
      State.reset();
      packages = State.packages;
      Oasis.consumers = State.consumers;
    };
    Oasis.reset();

    Oasis.config = configuration;


    /**
      This registers a sandbox type inside of the containing environment so that
      it can be referenced by URL in `createSandbox`.

      Options:

      * `capabilities`: An array of service names that will be supplied when calling
        `createSandbox`
      * `url`: The URL of the JavaScript file that contains the sandbox code

      @param {Object} options
    */
    Oasis.register = function(options) {
      assert(options.capabilities, "You are trying to register a package without any capabilities. Please provide a list of requested capabilities, or an empty array ([]).");

      packages[options.url] = options;
    };

    Oasis.registerHandler = registerHandler;
    Oasis.connect = connect;
    Oasis.portFor = portFor;

    // initializeSandbox will detect whether we are in a sandbox that needs
    // initialization or not.
    initializeSandbox();


    Oasis.RSVP = RSVP;

    return Oasis;
  });define("oasis/base_adapter",
  ["oasis/util", "oasis/shims", "oasis/ports", "oasis/message_channel", "oasis/logger", "oasis/config"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, Logger, configuration) {
    "use strict";
    var mustImplement = __dependency1__.mustImplement;
    var a_forEach = __dependency2__.a_forEach;
    var addEventListener = __dependency2__.addEventListener;
    var removeEventListener = __dependency2__.removeEventListener;
    var handlers = __dependency3__.handlers;
    var PostMessagePort = __dependency4__.PostMessagePort;
    var PostMessageMessageChannel = __dependency4__.PostMessageMessageChannel;


    function getBase () {
      var link = document.createElement("a");
      link.href = "!";
      var base = link.href.slice(0, -1);

      return base;
    }

    function BaseAdapter() {
      this.oasisLoadedMessage =  "oasisSandboxLoaded";

      this.sandboxInitializedMessage =  "oasisSandboxInitialized";
    }

    BaseAdapter.prototype = {
      loadScripts: mustImplement('BaseAdapter', 'loadScripts'),

      oasisURL: function(sandbox) {
        return sandbox.options.oasisURL || configuration.oasisURL || 'oasis.js.html';
      },

      createChannel: function(sandbox) {
        var channel = new PostMessageMessageChannel();
        channel.port1.start();
        return channel;
      },

      environmentPort: function(sandbox, channel) {
        return channel.port1;
      },

      sandboxPort: function(sandbox, channel) {
        return channel.port2;
      },

      proxyPort: function(sandbox, port) {
        return port;
      },

      connectSandbox: function (receiver, ports) {
        var adapter = this;

        Logger.log("Listening for initialization message");

        function initializeOasisSandbox(event) {
          if (!event.data.isOasisInitialization) { return; }

          Logger.log("Sandbox initializing.");

          configuration.oasisURL = event.data.oasisURL;

          removeEventListener(receiver, 'message', initializeOasisSandbox);
          adapter.loadScripts(event.data.base, event.data.scriptURLs);

          var capabilities = event.data.capabilities, eventPorts = event.ports;

          a_forEach.call(capabilities, function(capability, i) {
            var handler = handlers[capability],
                port = new PostMessagePort(eventPorts[i]);

            if (handler) {
              Logger.log("Invoking handler for '" + capability + "'");

              handler.setupCapability(port);
              port.start();
            }

            ports[capability] = port;
          });
          adapter.didConnect();
        }
        addEventListener(receiver, 'message', initializeOasisSandbox);

        adapter.oasisLoaded();
      },

      createInitializationMessage: function (sandbox) {
        var sandboxURL = sandbox.options.url,
            scriptURLs = [sandboxURL].concat(sandbox.dependencies || []);

        return {
          isOasisInitialization: true,
          capabilities: sandbox.capabilities,
          base: getBase(),
          scriptURLs: scriptURLs,
          oasisURL: this.oasisURL(sandbox)
        };
      }
    }

    return BaseAdapter;
  });define("oasis/config",
  [],
  function() {
    "use strict";
    /**
      Stores Oasis configuration.  Options include:

      `oasisURL` - the default URL to use for sandboxes.
    */
    var configuration = {
    };

    return configuration;
  });define("oasis/connect",
  ["oasis/util", "oasis/ports", "rsvp", "oasis/logger", "oasis/state", "exports"],
  function(__dependency1__, __dependency2__, RSVP, Logger, State, __exports__) {
    "use strict";
    var assert = __dependency1__.assert;
    var rsvpErrorHandler = __dependency1__.rsvpErrorHandler;
    var handlers = __dependency2__.handlers;
    var ports = __dependency2__.ports;


    function registerHandler(capability, options) {
      var port = ports[capability];

      if (port) {
        Logger.log("Found port, setting up '" + capability + "'");
        options.setupCapability(port);

        if (options.promise) {
          options.promise.then(function() {
            port.start();
          }).then(null, rsvpErrorHandler);
        } else {
          port.start();
        }
      } else {
        Logger.log("No port found, saving handler for '" + capability + "'");
        handlers[capability] = options;
      }
    };

    /**
      This is the main entry point that allows sandboxes to connect back
      to their containing environment.

      It should be called once for each service provided by the containing
     environment that it wants to connect to.

      @param {String} serviceName the name of the service to connect to
      @param {Function?} callback the callback to trigger once the other
        side of the connection is available
      @return {Promise} a promise that will be resolved once the other
        side of the connection is available. You can use this instead
        of the callback.
    */
    function connect(capability, callback) {
      function setupCapability(Consumer, name) {
        return function(port) {
          var consumer = new Consumer(port);
          State.consumers[name] = consumer;
          consumer.initialize(port, name);
          port.start();
        };
      }

      if (typeof capability === 'object') {
        var consumers = capability.consumers;

        for (var prop in consumers) {
          registerHandler(prop, {
            setupCapability: setupCapability(consumers[prop], prop)
          });
        }
      } else if (callback) {
        Logger.log("Connecting to '" + capability + "' with callback.");

        registerHandler(capability, {
          setupCapability: function(port) {
            callback(port);
          }
        });
      } else {
        Logger.log("Connecting to '" + capability + "' with promise.");

        var defered = RSVP.defer();
        registerHandler(capability, {
          promise: defered.promise,
          setupCapability: function(port) {
            defered.resolve(port);
          }
        });
        return defered.promise;
      }
    };

    function portFor(capability) {
      var port = ports[capability];
      assert(port, "You asked for the port for the '" + capability + "' capability, but the environment did not provide one.");
      return port;
    };

    __exports__.registerHandler = registerHandler;
    __exports__.connect = connect;
    __exports__.portFor = portFor;
  });define("oasis/iframe_adapter",
  ["oasis/util", "oasis/shims", "rsvp", "oasis/logger", "oasis/base_adapter"],
  function(__dependency1__, __dependency2__, RSVP, Logger, BaseAdapter) {
    "use strict";
    var extend = __dependency1__.extend;
    var addEventListener = __dependency2__.addEventListener;
    var removeEventListener = __dependency2__.removeEventListener;
    var a_map = __dependency2__.a_map;


    var IframeAdapter = extend(BaseAdapter, {
      initializeSandbox: function(sandbox) {
        var options = sandbox.options,
            iframe = document.createElement('iframe'),
            oasisURL = this.oasisURL(sandbox);

        iframe.name = sandbox.options.url;
        iframe.sandbox = 'allow-same-origin allow-scripts';
        iframe.seamless = true;
        iframe.src = 'about:blank';

        // rendering-specific code
        if (options.width) {
          iframe.width = options.width;
        } else if (options.height) {
          iframe.height = options.height;
        }

        iframe.oasisLoadHandler = function () {
          removeEventListener(iframe, 'load', iframe.oasisLoadHandler);

          sandbox.iframeLoaded = true;

          Logger.log("iframe loading oasis");
          iframe.contentWindow.location.href = oasisURL;
        };
        addEventListener(iframe, 'load', iframe.oasisLoadHandler);

        sandbox.promise = new RSVP.Promise( function(resolve, reject) {
          iframe.initializationHandler = function (event) {
            if( event.data !== sandbox.adapter.sandboxInitializedMessage ) {return;}
            if( !sandbox.iframeLoaded ) {return;}
            if( event.source !== iframe.contentWindow ) {return;}
            removeEventListener(window, 'message', iframe.initializationHandler);


            Logger.log("iframe sandbox initialized");
            resolve(sandbox);
          };
          addEventListener(window, 'message', iframe.initializationHandler);
        });

        sandbox.el = iframe;

        return new RSVP.Promise(function (resolve, reject) {
          iframe.loadHandler = function (event) {
            if( event.data !== sandbox.adapter.oasisLoadedMessage ) {return;}
            if( !sandbox.iframeLoaded ) {return;}
            if( event.source !== iframe.contentWindow ) {return;}
            removeEventListener(window, 'message', iframe.loadHandler);

            Logger.log("iframe sandbox loaded");
            resolve(sandbox);
          };
          addEventListener(window, 'message', iframe.loadHandler);
        });
      },

      loadScripts: function (base, scriptURLs) {
        var head = document.head || document.documentElement.getElementsByTagName('head')[0],
            scriptElement;

        var baseElement = document.createElement('base');
        baseElement.href = base;
        head.insertBefore(baseElement, head.childNodes[0] || null);

        for (var i = 0; i < scriptURLs.length; ++i ) {
          scriptElement = document.createElement('script');
          scriptElement.src = scriptURLs[i];
          scriptElement.async = false;
          head.appendChild(scriptElement);
        }
      },

      oasisLoaded: function() {
        window.parent.postMessage(this.oasisLoadedMessage, '*', []);
      },

      didConnect: function() {
        window.parent.postMessage(this.sandboxInitializedMessage, '*', []);
      },

      startSandbox: function(sandbox) {
        var head = document.head || document.documentElement.getElementsByTagName('head')[0];
        head.appendChild(sandbox.el);
      },

      terminateSandbox: function(sandbox) {
        var el = sandbox.el;

        sandbox.terminated = true;
        removeEventListener(el, 'load', el.oasisLoadHandler);
        removeEventListener(window, 'message', el.initializationHandler);
        removeEventListener(window, 'message', el.loadHandler);

        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }

        sandbox.el = null;
      },

      connectPorts: function(sandbox, ports) {
        var rawPorts = a_map.call(ports, function(port) { return port.port; }),
            message = this.createInitializationMessage(sandbox);

        if (sandbox.terminated) { return; }
        Window.postMessage(sandbox.el.contentWindow, message, '*', rawPorts);
      },

      connectSandbox: function(ports) {
        return BaseAdapter.prototype.connectSandbox.call(this, window, ports);
      }
    });

    var iframeAdapter = new IframeAdapter;

    return iframeAdapter;
  });define("oasis/logger",
  [],
  function() {
    "use strict";
    function Logger() {
      this.enabled = false;
    }

    Logger.prototype = {
      enable: function () {
        this.enabled = true;
      },

      log: function () {
        if (logger.enabled) {
          if (typeof console !== 'undefined' && typeof console.log === 'function') {
            console.log.apply(console, arguments);
          } else if (typeof console !== 'undefined' && typeof console.log === 'object') {
            // Log in IE
            try {
              switch (arguments.length) {
                case 1:
                  console.log(arguments[0]);
                  break;
                case 2:
                  console.log(arguments[0], arguments[1]);
                  break;
                default:
                  console.log(arguments[0], arguments[1], arguments[2]);
              }
            } catch(e) {}
          }
        }
      }
    }

    var logger = new Logger;

    return logger;
  });define("oasis/message_channel",
  ["oasis/util", "rsvp", "oasis/state", "exports"],
  function(__dependency1__, RSVP, OasisState, __exports__) {
    "use strict";
    var extend = __dependency1__.extend;
    var mustImplement = __dependency1__.mustImplement;
    var rsvpErrorHandler = __dependency1__.rsvpErrorHandler;

    /**
      OasisPort is an interface that adapters can use to implement ports.
      Ports are passed into the `initialize` method of services and consumers,
      and are available as `this.port` on services and consumers.

      Ports are the low-level API that can be used to communicate with the
      other side of a connection. In general, you will probably want to use
      the `events` and `requests` objects inside your service or consumer
      rather than manually listen for events and requests.

      @constructor
      @param {OasisPort} port
    */
    function OasisPort(port) {}


    function getRequestId() {
      return OasisState.oasisId + '-' + OasisState.requestId++;
    };

    OasisPort.prototype = {
      /**
        This allows you to register an event handler for a particular event
        name.

        @param {String} eventName the name of the event
        @param {Function} callback the callback to call when the event occurs
        @param {any?} binding an optional value of `this` inside of the callback
      */
      on: mustImplement('OasisPort', 'on'),

      /**
        Allows you to register an event handler that is called for all events
        that are sent to the port.
      */
      all: mustImplement('OasisPort', 'all'),

      /**
        This allows you to unregister an event handler for an event name
        and callback. You should not pass in the optional binding.

        @param {String} eventName the name of the event
        @param {Function} callback a reference to the callback that was
          passed into `.on`.
      */
      off: mustImplement('OasisPort', 'off'),

      /**
        This method sends an event to the other side of the connection.

        @param {String} eventName the name of the event
        @param {Structured?} data optional data to pass along with the event
      */
      send: mustImplement('OasisPort', 'send'),

      /**
        @private

        Adapters should implement this to start receiving messages from the
        other side of the connection.

        It is up to the adapter to make sure that no messages are dropped if
        they are sent before `start` is called.
      */
      start: mustImplement('OasisPort', 'start'),

      /**
        @private

        Adapters should implement this to stop receiving messages from the
        other side of the connection.
      */
      close: mustImplement('OasisPort', 'close'),

      /**
        This method sends a request to the other side of the connection.

        @param {String} requestName the name of the request
        @return {Promise} a promise that will be resolved with the value
          provided by the other side of the connection. The fulfillment value
          must be structured data.
      */
      request: function(eventName) {
        var port = this;
        var args = [].slice.call(arguments, 1);

        return new RSVP.Promise(function (resolve, reject) {
          var requestId = getRequestId();

          var observer = function(event) {
            if (event.requestId === requestId) {
              port.off('@response:' + eventName, observer);
              resolve(event.data);
            }
          };

          port.on('@response:' + eventName, observer, port);
          port.send('@request:' + eventName, { requestId: requestId, args: args });
        });
      },

      /**
        This method registers a callback to be called when a request is made
        by the other side of the connection.

        The callback will be called with a promise, that the callback should fulfill.

        Examples

          service.onRequest('name', function (promise) {
            promise.resolve('David');
          });

        @param {String} requestName the name of the request
        @param {Function} callback the callback to be called when a request
          is made.
        @param {any?} binding the value of `this` in the callback
      */
      onRequest: function(eventName, callback, binding) {
        var self = this;

        this.on('@request:' + eventName, function(data) {
          var requestId = data.requestId,
              args = data.args,
              defered = RSVP.defer();

          defered.promise.then(function (data) {
            self.send('@response:' + eventName, {
              requestId: requestId,
              data: data
            });
          }).then(null, rsvpErrorHandler);

          args.unshift(defered);
          callback.apply(binding, args);
        });
      }
    };


    function OasisMessageChannel() {}

    OasisMessageChannel.prototype = {
      start: mustImplement('OasisMessageChannel', 'start')
    };


    var PostMessageMessageChannel = extend(OasisMessageChannel, {
      initialize: function() {
        this.channel = new MessageChannel();
        this.port1 = new PostMessagePort(this.channel.port1);
        this.port2 = new PostMessagePort(this.channel.port2);
      },

      start: function() {
        this.port1.start();
        this.port2.start();
      },

      destroy: function() {
        this.port1.close();
        this.port2.close();
        delete this.port1;
        delete this.port2;
        delete this.channel;
      }
    });

    var PostMessagePort = extend(OasisPort, {
      initialize: function(port) {
        this.port = port;
        this._callbacks = [];
      },

      on: function(eventName, callback, binding) {
        function wrappedCallback(event) {
          if (event.data.type === eventName) {
            callback.call(binding, event.data.data);
          }
        }

        this._callbacks.push([callback, wrappedCallback]);
        this.port.addEventListener('message', wrappedCallback);
      },

      all: function(callback, binding) {
        this.port.addEventListener('message', function(event) {
          callback.call(binding, event.data.type, event.data.data);
        });
      },

      off: function(eventName, callback) {
        var foundCallback;

        for (var i=0, l=this._callbacks.length; i<l; i++) {
          foundCallback = this._callbacks[i];
          if (foundCallback[0] === callback) {
            this.port.removeEventListener('message', foundCallback[1]);
          }
        }
      },

      send: function(eventName, data) {
        this.port.postMessage({
          type: eventName,
          data: data
        });
      },

      start: function() {
        this.port.start();
      },

      close: function() {
        var foundCallback;

        for (var i=0, l=this._callbacks.length; i<l; i++) {
          foundCallback = this._callbacks[i];
          this.port.removeEventListener('message', foundCallback[1]);
        }
        this._callbacks = [];

        this.port.close();
      }
    });

    __exports__.OasisPort = OasisPort;
    __exports__.PostMessageMessageChannel = PostMessageMessageChannel;
    __exports__.PostMessagePort = PostMessagePort;
  });define("oasis/ports",
  ["exports"],
  function(__exports__) {
    "use strict";
    var ports = {};
    var handlers = {};

    __exports__.handlers = handlers;
    __exports__.ports = ports;
  });define("oasis/sandbox",
  ["oasis/util", "oasis/shims", "oasis/message_channel", "rsvp", "oasis/logger", "oasis/state", "oasis/config", "oasis/iframe_adapter"],
  function(__dependency1__, __dependency2__, __dependency3__, RSVP, Logger, State, configuration, iframeAdapter) {
    "use strict";
    var assert = __dependency1__.assert;
    var rsvpErrorHandler = __dependency1__.rsvpErrorHandler;
    var a_forEach = __dependency2__.a_forEach;
    var a_reduce = __dependency2__.a_reduce;
    var OasisPort = __dependency3__.OasisPort;


    var OasisSandbox = function(options) {
      this.connections = {};
      this.wiretaps = [];

      // Generic capabilities code
      var pkg = State.packages[options.url];

      var capabilities = options.capabilities;
      if (!capabilities) {
        assert(pkg, "You are trying to create a sandbox from an unregistered URL without providing capabilities. Please use Oasis.register to register your package or pass a list of capabilities to createSandbox.");
        capabilities = pkg.capabilities;
      }

      pkg = pkg || {};

      this.dependencies = options.dependencies || pkg.dependencies;

      var adapter = this.adapter = options.adapter || iframeAdapter;

      this.capabilities = capabilities;
      this.envPortDefereds = {};
      this.sandboxPortDefereds = {};
      this.channels = {};
      this.options = options;

      var loadPromise = adapter.initializeSandbox(this);

      a_forEach.call(this.capabilities, function(capability) {
        this.envPortDefereds[capability] = RSVP.defer();
        this.sandboxPortDefereds[capability] = RSVP.defer();
      }, this);

      var sandbox = this;
      loadPromise.then(function () {
        sandbox.createChannels();
        sandbox.connectPorts();
      }).then(null, rsvpErrorHandler);
    };

    OasisSandbox.prototype = {
      wiretap: function(callback) {
        this.wiretaps.push(callback);
      },

      connect: function(capability) {
        var portPromise = this.envPortDefereds[capability].promise;

        assert(portPromise, "Connect was called on '" + capability + "' but no such capability was registered.");

        return portPromise;
      },

      createChannels: function () {
        var sandbox = this,
            services = this.options.services || {},
            channels = this.channels;
        a_forEach.call(this.capabilities, function (capability) {

          Logger.log("Will create port for '" + capability + "'");
          var service = services[capability],
              channel, port;

          // If an existing port is provided, just
          // pass it along to the new sandbox.

          // TODO: This should probably be an OasisPort if possible
          if (service instanceof OasisPort) {
            port = this.adapter.proxyPort(this, service);
          } else {
            channel = channels[capability] = this.adapter.createChannel();

            var environmentPort = this.adapter.environmentPort(this, channel),
                sandboxPort = this.adapter.sandboxPort(this, channel);

            Logger.log("Wiretapping '" + capability + "'");

            environmentPort.all(function(eventName, data) {
              a_forEach.call(this.wiretaps, function(wiretap) {
                wiretap(capability, {
                  type: eventName,
                  data: data,
                  direction: 'received'
                });
              });
            }, this);

            a_forEach.call(this.wiretaps, function(wiretap) {
              var originalSend = environmentPort.send;

              environmentPort.send = function(eventName, data) {
                wiretap(capability, {
                  type: eventName,
                  data: data,
                  direction: 'sent'
                });

                originalSend.apply(environmentPort, arguments);
              };
            });

            if (service) {
              Logger.log("Creating service for '" + capability + "'");
              /*jshint newcap:false*/
              // Generic
              service = new service(environmentPort, this);
              service.initialize(environmentPort, capability);
              State.services.push(service);
            }

            // Law of Demeter violation
            port = sandboxPort;

            this.envPortDefereds[capability].resolve(environmentPort);
          }

          Logger.log("Port created for '" + capability + "'");
          this.sandboxPortDefereds[capability].resolve(port);
        }, this);
      },

      destroyChannels: function() {
        for( var prop in this.channels ) {
          this.channels[prop].destroy();
          delete this.channels[prop];
        }
        this.channels = [];
      },

      connectPorts: function () {
        var sandbox = this;

        var allSandboxPortPromises = a_reduce.call(this.capabilities, function (accumulator, capability) {
          return accumulator.concat(sandbox.sandboxPortDefereds[capability].promise);
        }, []);

        RSVP.all(allSandboxPortPromises).then(function (ports) {
          Logger.log("All " + ports.length + " ports created.  Transferring them.");
          sandbox.adapter.connectPorts(sandbox, ports);
        }).then(null, rsvpErrorHandler);
      },

      start: function(options) {
        this.adapter.startSandbox(this, options);
      },

      terminate: function() {
        var channel,
            environmentPort;

        if( this.isTerminated ) { return; }
        this.isTerminated = true;

        this.adapter.terminateSandbox(this);

        this.destroyChannels();

        for( var index=0 ; index<State.services.length ; index++) {
          State.services[index].destroy();
          delete State.services[index];
        }
        State.services = [];
      }
    };

    return OasisSandbox;
  });define("oasis/sandbox_init",
  ["oasis/ports", "oasis/iframe_adapter", "oasis/webworker_adapter"],
  function(__dependency1__, iframeAdapter, webworkerAdapter) {
    "use strict";
    var ports = __dependency1__.ports;


    function initializeSandbox () {
      if (typeof window !== 'undefined') {
        iframeAdapter.connectSandbox(ports);
      } else {
        webworkerAdapter.connectSandbox(ports);
      }
    };

    return initializeSandbox;
  });define("oasis/service",
  ["oasis/shims"],
  function(__dependency1__) {
    "use strict";
    var o_create = __dependency1__.o_create;

    /**
      This is a base class that services and consumers can subclass to easily
      implement a number of events and requests at once.

      Example:

          var MetadataService = Oasis.Service.extend({
            initialize: function() {
              this.send('data', this.sandbox.data);
            },

            events: {
              changed: function(data) {
                this.sandbox.data = data;
              }
            },

            requests: {
              valueForProperty: function(name, promise) {
                promise.resolve(this.sandbox.data[name]);
              }
            }
          });

      In the above example, the metadata service implements the Service
      API using `initialize`, `events` and `requests`.

      Both services (implemented in the containing environment) and
      consumers (implemented in the sandbox) use the same API for
      registering events and requests.

      In the containing environment, a service is registered in the
      `createSandbox` method. In the sandbox, a consumer is registered
      using `Oasis.connect`.

      ### `initialize`

      Oasis calls the `initialize` method once the other side of the
      connection has initialized the connection.

      This method is useful to pass initial data back to the other side
      of the connection. You can also set up events or requests manually,
      but you will usually want to use the `events` and `requests` sections
      for events and requests.

      ### `events`

      The `events` object is a list of event names and associated callbacks.
      Oasis will automatically set up listeners for each named event, and
      trigger the callback with the data provided by the other side of the
      connection.

      ### `requests`

      The `requests` object is a list of request names and associated
      callbacks. Oasis will automatically set up listeners for requests
      made by the other side of the connection, and trigger the callback
      with the request information as well as a promise that you should
      use to fulfill the request.

      Once you have the information requested, you should call
      `promise.resolve` with the response data.

      @constructor
      @param {OasisPort} port
      @param {OasisSandbox} sandbox in the containing environment, the
        OasisSandbox that this service is connected to.
    */
    function Service (port, sandbox) {
      var service = this, prop, callback;

      this.sandbox = sandbox;
      this.port = port;

      function xform(callback) {
        return function() {
          callback.apply(service, arguments);
        };
      }

      for (prop in this.events) {
        callback = this.events[prop];
        port.on(prop, xform(callback));
      }

      for (prop in this.requests) {
        callback = this.requests[prop];
        port.onRequest(prop, xform(callback));
      }
    };

    Service.prototype = {
      /**
        This hook is called when the connection is established. When
        `initialize` is called, it is safe to register listeners and
        send data to the other side.

        The implementation of Oasis makes it impossible for messages
        to get dropped on the floor due to timing issues.

        @param {OasisPort} port the port to the other side of the connection
        @param {String} name the name of the service
      */
      initialize: function() {},

      /**
        This hook is called when the connection is stopped. When
        `destroy` is called, it is safe to unregister listeners.
      */
      destroy: function() {},

      /**
        This method can be used to send events to the other side of the
        connection.

        @param {String} eventName the name of the event to send to the
          other side of the connection
        @param {Structured} data an additional piece of data to include
          as the data for the event.
      */
      send: function() {
        return this.port.send.apply(this.port, arguments);
      },

      /**
        This method can be used to request data from the other side of
        the connection.

        @param {String} requestName the name of the request to send to
          the other side of the connection.
        @return {Promise} a promise that will be resolved by the other
          side of the connection. Use `.then` to wait for the resolution.
      */
      request: function() {
        return this.port.request.apply(this.port, arguments);
      }
    };

    Service.extend = function extend(object) {
      var superConstructor = this;

      function Service() {
        if (Service.prototype.init) { Service.prototype.init.call(this); }
        superConstructor.apply(this, arguments);
      }

      Service.extend = extend;

      var ServiceProto = Service.prototype = o_create(this.prototype);

      for (var prop in object) {
        ServiceProto[prop] = object[prop];
      }

      return Service;
    };

    return Service;
  });define("oasis/shims",
  ["exports"],
  function(__exports__) {
    "use strict";
    var K = function() {};

    function o_create(obj, props) {
      K.prototype = obj;
      obj = new K();
      if (props) {
        K.prototype = obj;
        for (var prop in props) {
          K.prototype[prop] = props[prop].value;
        }
        obj = new K();
      }
      K.prototype = null;

      return obj;
    };

    // If it turns out we need a better polyfill we can grab mozilla's at: 
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.removeEventListener?redirectlocale=en-US&redirectslug=DOM%2FEventTarget.removeEventListener#Polyfill_to_support_older_browsers
    function addEventListener(receiver, eventName, fn) {
      if (receiver.addEventListener) {
        return receiver.addEventListener(eventName, fn);
      } else if (receiver.attachEvent) {
        return receiver.attachEvent('on' + eventName, fn);
      }
    }

    function removeEventListener(receiver, eventName, fn) {
      if (receiver.removeEventListener) {
        return receiver.removeEventListener(eventName, fn);
      } else if (receiver.detachEvent) {
        return receiver.detachEvent('on' + eventName, fn);
      }
    }

    function isNativeFunc(func) {
      // This should probably work in all browsers likely to have ES5 array methods
      return func && Function.prototype.toString.call(func).indexOf('[native code]') > -1;
    }

    var a_forEach = isNativeFunc(Array.prototype.forEach) ? Array.prototype.forEach : function(fun /*, thisp */) {
      //"use strict";

      if (this === void 0 || this === null) {
        throw new TypeError();
      }

      var t = Object(this);
      var len = t.length >>> 0;
      if (typeof fun !== "function") {
        throw new TypeError();
      }

      var thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in t) {
          fun.call(thisp, t[i], i, t);
        }
      }
    };

    var a_reduce = isNativeFunc(Array.prototype.reduce) ? Array.prototype.reduce : function(callback, opt_initialValue){
      'use strict';
      if (null === this || 'undefined' === typeof this) {
        // At the moment all modern browsers, that support strict mode, have
        // native implementation of Array.prototype.reduce. For instance, IE8
        // does not support strict mode, so this check is actually useless.
        throw new TypeError(
            'Array.prototype.reduce called on null or undefined');
      }
      if ('function' !== typeof callback) {
        throw new TypeError(callback + ' is not a function');
      }
      var index = 0, length = this.length >>> 0, value, isValueSet = false;
      if (1 < arguments.length) {
        value = opt_initialValue;
        isValueSet = true;
      }
      for ( ; length > index; ++index) {
        if (!this.hasOwnProperty(index)) continue;
        if (isValueSet) {
          value = callback(value, this[index], index, this);
        } else {
          value = this[index];
          isValueSet = true;
        }
      }
      if (!isValueSet) {
        throw new TypeError('Reduce of empty array with no initial value');
      }
      return value;
    };

    var a_map = isNativeFunc(Array.prototype.map) ? Array.prototype.map : function(callback, thisArg) {

        var T, A, k;

        if (this == null) {
          throw new TypeError(" this is null or not defined");
        }

        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== "function") {
          throw new TypeError(callback + " is not a function");
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (thisArg) {
          T = thisArg;
        }

        // 6. Let A be a new array created as if by the expression new Array(len) where Array is
        // the standard built-in constructor with that name and len is the value of len.
        A = new Array(len);

        // 7. Let k be 0
        k = 0;

        // 8. Repeat, while k < len
        while(k < len) {

          var kValue, mappedValue;

          // a. Let Pk be ToString(k).
          //   This is implicit for LHS operands of the in operator
          // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
          //   This step can be combined with c
          // c. If kPresent is true, then
          if (k in O) {

            // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
            kValue = O[ k ];

            // ii. Let mappedValue be the result of calling the Call internal method of callback
            // with T as the this value and argument list containing kValue, k, and O.
            mappedValue = callback.call(T, kValue, k, O);

            // iii. Call the DefineOwnProperty internal method of A with arguments
            // Pk, Property Descriptor {Value: mappedValue, : true, Enumerable: true, Configurable: true},
            // and false.

            // In browsers that support Object.defineProperty, use the following:
            // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

            // For best browser support, use the following:
            A[ k ] = mappedValue;
          }
          // d. Increase k by 1.
          k++;
        }

        // 9. return A
        return A;
      };  

    __exports__.o_create = o_create;
    __exports__.a_forEach = a_forEach;
    __exports__.a_reduce = a_reduce;
    __exports__.a_map = a_map;
    __exports__.addEventListener = addEventListener;
    __exports__.removeEventListener = removeEventListener;
  });define("oasis/state",
  [],
  function() {
    "use strict";
    function State () {
      this.reset();
    };

    State.prototype.reset = function () {
      this.packages = {};
      this.requestId = 0;
      this.oasisId = 'oasis' + (+new Date());

      this.consumers = {};
      this.services = [];
    }

    return new State;
  });define("oasis/util",
  ["oasis/shims", "exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var o_create = __dependency1__.o_create;

    function assert(assertion, string) {
      if (!assertion) {
        throw new Error(string);
      }
    }

    function verifySandbox() {
      var iframe = document.createElement('iframe');

      iframe.sandbox = 'allow-scripts';
      assert(iframe.getAttribute('sandbox') === 'allow-scripts', "The current version of Oasis requires Sandboxed iframes, which are not supported on your current platform. See http://caniuse.com/#feat=iframe-sandbox");

      assert(typeof MessageChannel !== 'undefined', "The current version of Oasis requires MessageChannel, which is not supported on your current platform. A near-future version of Oasis will polyfill MessageChannel using the postMessage API");
    }

    function mustImplement(className, name) {
      return function() {
        throw new Error("Subclasses of " + className + " must implement " + name);
      };
    }

    function extend(parent, object) {
      function OasisObject() {
        parent.apply(this, arguments);
        if (this.initialize) {
          this.initialize.apply(this, arguments);
        }
      }

      OasisObject.prototype = o_create(parent.prototype);

      for (var prop in object) {
        if (!object.hasOwnProperty(prop)) { continue; }
        OasisObject.prototype[prop] = object[prop];
      }

      return OasisObject;
    }

    function rsvpErrorHandler(error) {
      if (typeof console === 'object' && console.assert && console.error) {
        // chrome does not (yet) link the URLs in `console.assert`
        console.error(error.stack);
        console.assert(false, error.message);
      }
      // throw an error upstream for tests & browsers without `console.assert`
      setTimeout( function () { throw error; }, 1);
      // also throw an error sync. to cascade promise failure
      throw error;
    }

    __exports__.assert = assert;
    __exports__.extend = extend;
    __exports__.mustImplement = mustImplement;
    __exports__.verifySandbox = verifySandbox;
    __exports__.rsvpErrorHandler = rsvpErrorHandler;
  });define("oasis/webworker_adapter",
  ["oasis/util", "oasis/shims", "rsvp", "oasis/logger", "oasis/base_adapter"],
  function(__dependency1__, __dependency2__, RSVP, Logger, BaseAdapter) {
    "use strict";
    var extend = __dependency1__.extend;
    var a_forEach = __dependency2__.a_forEach;
    var addEventListener = __dependency2__.addEventListener;
    var removeEventListener = __dependency2__.removeEventListener;


    var WebworkerAdapter = extend(BaseAdapter, {
      initializeSandbox: function(sandbox) {
        var oasisURL = this.oasisURL(sandbox);
        var worker = new Worker(oasisURL);
        sandbox.worker = worker;

        sandbox.promise = new RSVP.Promise( function(resolve, reject) {
          worker.initializationHandler = function (event) {
            if( event.data !== sandbox.adapter.sandboxInitializedMessage ) {return;}
            removeEventListener(worker, 'message', worker.initializationHandler);

            Logger.log("worker sandbox initialized");
            resolve(sandbox);
          };
          addEventListener(worker, 'message', worker.initializationHandler);
        });

        return new RSVP.Promise(function (resolve, reject) {
          worker.loadHandler = function (event) {
            if( event.data !== sandbox.adapter.oasisLoadedMessage ) {return;}
            removeEventListener(worker, 'message', worker.loadHandler);

            Logger.log("worker sandbox initialized");
            resolve(sandbox);
          };
          addEventListener(worker, 'message', worker.loadHandler);
        });
      },

      loadScripts: function (base, scriptURLs) {
        var hrefs = [];
        a_forEach.call(scriptURLs, function (scriptURL) {
          hrefs.push( base + scriptURL );
        });

        importScripts.apply(undefined, hrefs);
      },

      oasisLoaded: function() {
        postMessage(this.oasisLoadedMessage, []);
      },

      didConnect: function() {
        postMessage(this.sandboxInitializedMessage, []);
      },

      startSandbox: function(sandbox) { },

      terminateSandbox: function(sandbox) {
        var worker = sandbox.worker;

        removeEventListener(worker, 'message', worker.loadHandler);
        removeEventListener(worker, 'message', worker.initializationHandler);
        sandbox.worker.terminate();
      },

      connectPorts: function(sandbox, ports) {
        var rawPorts = ports.map(function(port) { return port.port; }),
            message = this.createInitializationMessage(sandbox);

        Worker.postMessage(sandbox.worker, message, rawPorts);
      },

      connectSandbox: function(ports) {
        return BaseAdapter.prototype.connectSandbox.call(this, self, ports);
      }
    });

    var webworkerAdapter = new WebworkerAdapter;

    return webworkerAdapter;
  });
(function(exports) {exports.Oasis = requireModule('oasis');})(this);

(function(exports, Oasis) {
  "use strict";

  var Conductor = function(options) {
    this.options = options || {};
    this.conductorURL = this.options.conductorURL || 
                        Oasis.config.oasisURL ||
                        '/dist/conductor.js-0.2.0.js.html';

    this.data = {};
    this.cards = {};
    this.services = Object.create(Conductor.services);
    this.capabilities = Conductor.capabilities.slice();
  };

  Conductor.error = function (error) {
    if (typeof console === 'object' && console.assert && console.error) {
      // chrome does not (yet) link the URLs in `console.assert`
      console.error(error.stack);
      console.assert(false, error.message);
    } else {
      setTimeout( function () {
        throw error;
      }, 1);
    }
    throw error;
  };

  Conductor.Oasis = Oasis;

  var requiredUrls = [],
      requiredCSSUrls = [],
      RSVP = Conductor.Oasis.RSVP,
      Promise = RSVP.Promise;

  function coerceId(id) {
    return id + '';
  }

  Conductor.prototype = {
    loadData: function(url, id, data) {
      id = coerceId(id);

      this.data[url] = this.data[url] || {};
      this.data[url][id] = data;

      var cards = this.cards[url] && this.cards[url][id];

      if (!cards) { return; }

      cards.forEach(function(card) {
        card.updateData('*', data);
      });
    },

    updateData: function(card, bucket, data) {
      var url = card.url,
          id = card.id;

      this.data[url][id][bucket] = data;

      var cards = this.cards[url][id].slice(),
          index = cards.indexOf(card);

      cards.splice(index, 1);

      cards.forEach(function(card) {
        card.updateData(bucket, data);
      });
    },

    load: function(url, id, options) {
      id = coerceId(id);

      var datas = this.data[url],
          data = datas && datas[id],
          _options = options || {},
          extraCapabilities = _options.capabilities || [],
          capabilities = this.capabilities.slice();

      capabilities.push.apply(capabilities, extraCapabilities);

      // TODO: this should be a custom service provided in tests
      if (this.options.testing) {
        capabilities.push('assertion');
      }

      var sandbox = Conductor.Oasis.createSandbox({
        url: url,
        capabilities: capabilities,
        oasisURL: this.conductorURL,
        services: this.services
      });

      sandbox.data = data;
      sandbox.activateDefered = RSVP.defer();
      sandbox.activatePromise = sandbox.activateDefered.promise;

      var card = new Conductor.CardReference(sandbox);

      this.cards[url] = this.cards[url] || {};
      var cards = this.cards[url][id] = this.cards[url][id] || [];
      cards.push(card);

      card.url = url;
      card.id = id;

      sandbox.conductor = this;
      sandbox.card = card;

      // TODO: it would be better to access the consumer from
      // `conductor.parentCard` after the child card refactoring is in master.
      if (Conductor.Oasis.consumers.nestedWiretapping) {
        card.wiretap(function (service, messageEvent) {
          Conductor.Oasis.consumers.nestedWiretapping.send(messageEvent.type, {
            data: messageEvent.data,
            service: service+"",
            direction: messageEvent.direction,
            url: url,
            id: id
          });
        });
      }

      return card;
    }
  };


  var DomUtils = {};

  if (typeof window !== "undefined") {
    if (window.getComputedStyle) {
      DomUtils.getComputedStyleProperty = function (element, property) {
        return window.getComputedStyle(element)[property];
      };
    } else if (document.body.currentStyle) {
      DomUtils.getComputedStyleProperty = function (element, property) {
        var prop = property.replace(/-(\w)/g, function (_, letter) {
          return letter.toUpperCase();
        });
        return element.currentStyle[prop];
      };
    } else {
      throw new Error("Browser lacks support for both `getComputedStyle` and `currentStyle`");
    }
  }

  DomUtils.createStyleElement = function(css) {
    var style = document.createElement('style');

    style.type = 'text/css';
    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    return style;
  };

  var PathUtils = window.PathUtils = {
    dirname: function (path) {
      return path.substring(0, path.lastIndexOf('/'));
    },

    expandPath: function (path) {
      var parts = path.split('/');
      for (var i = 0; i < parts.length; ++i) {
        if (parts[i] === '..') {
          for (var j = i-1; j >= 0; --j) {
            if (parts[j] !== undefined) {
              parts[i] = parts[j] = undefined;
              break;
            }
          }
        }
      }
      return parts.filter(function (part) { return part !== undefined; }).join('/');
    },

    cardResourceUrl: function(baseUrl, resourceUrl) {
      var url;
      if (/^((http(s?):)|\/)/.test(resourceUrl)) {
        url = resourceUrl;
      } else {
        url = PathUtils.dirname(baseUrl) + '/' + resourceUrl;
      }

      return PathUtils.expandPath(url);
    }
  };

  /*global PathUtils */

  (function() {
    var requiredUrls = [],
        requiredCSSUrls = [],
        RSVP = requireModule('rsvp'),
        Promise = RSVP.Promise;

    function extend(a, b) {
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          a[key] = b[key];
        }
      }
      return a;
    }

    function getBase () {
      var link = document.createElement("a");
      link.href = "!";
      var base = link.href.slice(0, -1);

      return base;
    }

    Conductor.require = function(url) {
      requiredUrls.push(url);
    };

    Conductor.requireCSS = function(url) {
      requiredCSSUrls.push(url);
    };

    Conductor.Card = function(options) {
      var card = this,
          prop;

      for (prop in options) {
        this[prop] = options[prop];
      }

      this.consumers = Object.create(Conductor.Oasis.consumers);
      this.options = options = options || {};

      var renderDefered = this.defer();

      var xhrDefered = this.defer();

      options.events = options.events || {};
      options.requests = options.requests || {};

      var assertionDefered = this.defer();
      var dataDefered = this.defer();

      var activatePromise = this.activateWhen(dataDefered.promise, [ xhrDefered.promise ]);

      this.promise = activatePromise.then(function () {
        return card;
      }).then(null, Conductor.error);

      var cardOptions = {
        consumers: extend({
          xhr: Conductor.xhrConsumer(requiredUrls, requiredCSSUrls, xhrDefered, this),
          render: Conductor.renderConsumer(renderDefered, this),
          metadata: Conductor.metadataConsumer(this),
          // TODO: this should be a custom consumer provided in tests
          assertion: Conductor.assertionConsumer(assertionDefered, this),
          data: Conductor.dataConsumer(dataDefered, this),
          lifecycle: Conductor.lifecycleConsumer(activatePromise),
          height: Conductor.heightConsumer(this),
          nestedWiretapping: Conductor.nestedWiretapping(this)
        }, options.consumers)
      };

      for (prop in cardOptions.consumers) {
        cardOptions.consumers[prop] = cardOptions.consumers[prop].extend({card: this});
      }

      Conductor.Oasis.connect(cardOptions);
    };

    Conductor.Card.prototype = {
      defer: function(callback) {
        var defered = RSVP.defer();
        if (callback) { defered.promise.then(callback).then(null, Conductor.error); }
        return defered;
      },

      updateData: function(name, hash) {
        Conductor.Oasis.portFor('data').send('updateData', { bucket: name, object: hash });
      },

      /**
       A card can contain other cards.

       `childCards` is an array of objects describing the differents cards. The accepted attributes are:
       * `url` {String} the url of the card
       * `id` {String} a unique identifier for this instance (per type)
       * `options` {Object} Options passed to `Conductor.load` (optional)
       * `data` {Object} passed to `Conductor.loadData`

       Example:

          Conductor.card({
            childCards: [
              { url: '../cards/survey', id: 1 , options: {}, data: '' }
            ]
          });

       Any `Conductor.Oasis.Service` needed for a child card can be simply
       declared with the `services` attribute.  A card can contain other cards.

       Example:

          Conductor.card({
            services: {
              survey: SurveyService
            },
            childCards: [
              {url: 'survey', id: 1 , options: {capabilities: ['survey']} }
            ]
          });

       `loadDataForChildCards` can be defined when a child card needs data passed
       to the parent card.

       Once `initializeChildCards` has been called, the loaded card can be
       accessed through the `childCards` attribute.

       Example:

          var card = Conductor.card({
            childCards: [
              { url: '../cards/survey', id: 1 , options: {}, data: '' }
            ]
          });


          // After `initializeChildCards` has been called
          var surveyCard = card.childCards[0].card;

        Child cards can be added to the DOM by overriding `initializeDOM`.  The
        default behavior of `initializeDOM` is to add all child cards to the body
        element.
       */
      initializeChildCards: function( data ) {
        var prop;

        if(this.childCards) {
          this.conductor = new Conductor();
          this.conductor.services.xhr = Conductor.MultiplexService.extend({
            upstream: this.consumers.xhr,
            transformRequest: function (requestEventName, data) {
              var base = this.sandbox.options.url;
              if (requestEventName === 'get') {
                data.args = data.args.map(function (resourceUrl) {
                  var url = PathUtils.cardResourceUrl(base, resourceUrl);
                  return PathUtils.cardResourceUrl(getBase(), url);
                });
              }

              return data;
            }
          });

          // A child card may not need new services
          if( this.services ) {
            for( prop in this.services) {
              this.conductor.services[prop] = this.services[prop];
            }
          }

          // Hook if you want to initialize cards that are not yet instantiated
          if( this.loadDataForChildCards ) {
            this.loadDataForChildCards( data );
          }

          for( prop in this.childCards ) {
            var childCardOptions = this.childCards[prop];

            this.conductor.loadData(
              childCardOptions.url,
              childCardOptions.id,
              childCardOptions.data
            );

            childCardOptions.card = this.conductor.load( childCardOptions.url, childCardOptions.id, childCardOptions.options );
          }
        }
      },

      initializeDOM: function () {
        if (this.childCards) {
          this.childCards.forEach(function(cardInfo) {
            cardInfo.card.appendTo(document.body);
          });
        }
      },

      render: function () {},

      activateWhen: function(dataPromise, otherPromises) {
        var card = this;

        return RSVP.all([dataPromise].concat(otherPromises)).then(function(resolutions) {
          // Need to think if this called at the right place/time
          // My assumption for the moment is that
          // we don't rely on some initializations done in activate
          if (card.initializeChildCards) { card.initializeChildCards(resolutions[0]); }

          if (card.activate) { card.activate(resolutions[0]); }
        });
      }
    };

    Conductor.card = function(options) {
      return new Conductor.Card(options);
    };
  })();

  (function() {

  var Promise = Conductor.Oasis.RSVP.Promise;

  var CardReference = Conductor.CardReference = function(sandbox) {
    this.sandbox = sandbox;
    var card = this;

    this.promise = sandbox.promise.then(function () {
      return card;
    }).then(null, Conductor.error);

    return this;
  };

  CardReference.prototype = {
    metadataFor: function(name) {
      return this.sandbox.metadataPort.request('metadataFor', name);
    },

    instruct: function(info) {
      return this.sandbox.assertionPort.send('instruct', info);
    },

    appendTo: function(parent) {
      if (typeof parent === 'string') {
        var selector = parent;
        parent = document.querySelector(selector);
        if (!parent) { throw new Error("You are trying to append to '" + selector + "' but no element matching it was found"); }
      }

      parent.appendChild(this.sandbox.el);

      return this;
    },

    render: function(intent, dimensions) {
      var card = this;

      this.sandbox.activatePromise.then(function() {
        card.sandbox.renderPort.send('render', [intent, dimensions]);
      }).then(null, Conductor.error);
    },

    updateData: function(bucket, data) {
      var sandbox = this.sandbox;
      sandbox.activatePromise.then(function() {
        sandbox.dataPort.send('updateData', { bucket: bucket, data: data });
      }).then(null, Conductor.error);
    },

    wiretap: function(callback, binding) {
      this.sandbox.wiretap(function() {
        callback.apply(binding, arguments);
      });
    }
  };

  Conductor.Oasis.RSVP.EventTarget.mixin(CardReference.prototype);

  })();


  Conductor.assertionConsumer = function(promise, card) {
    return Conductor.Oasis.Consumer.extend({
      initialize: function() {
        var service = this;

        window.ok = function(bool, message) {
          service.send('ok', { bool: bool, message: message });
        };

        window.equal = function(expected, actual, message) {
          service.send('equal', { expected: expected, actual: actual, message: message });
        };

        window.start = function() {
          service.send('start');
        };

        promise.resolve();
      },

      events: {
        instruct: function(info) {
          card.instruct(info);
        }
      }
    });
  };

  Conductor.dataConsumer = function(promise, card) {
    return Conductor.Oasis.Consumer.extend({
      events: {
        initializeData: function(data) {
          card.data = data;
          promise.resolve(data);
        },

        updateData: function(data) {
          if (data.bucket === '*') {
            card.data = data.data;
          } else {
            card.data[data.bucket] = data.data;
          }

          if (card.didUpdateData) {
            card.didUpdateData(data.bucket, data.data);
          }
        }
      }
    });
  };

  /*global DomUtils*/

  /**
    The height consumer reports changes to the `documentElement`'s element to its
    parent environment.  This is obviated by the ALLOWSEAMLESS proposal, but no
    browser supports it yet.

    There are two mechanisms for reporting dimension changes: automatic (via DOM
    mutation observers) and manual.  By default, height resizing is automatic.  It
    must be disabled during card activation if `MutationObserver` is not
    supported.  It may be disabled during card activation if manual updates are
    preferred.

    Automatic updating can be disabled as follows:

    ```js
    Conductor.card({
      activate: function () {
        this.consumers.height.autoUpdate = false;
      }
    })
    ```

    Manual updates can be done either with specific dimensions, or manual updating
    can compute the dimensions.

    ```js
    card = Conductor.card({ ... });

    card.consumers.height.update({ width: 200, height: 200 });

    // dimensions of `document.body` will be computed.
    card.consumers.height.update();
    ```
  */
  Conductor.heightConsumer = function (card) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    return Conductor.Oasis.Consumer.extend({
      autoUpdate: true,

      initialize: function () {
        var consumer = this;

        card.promise.then(function () {
          if (!consumer.autoUpdate) {
            return;
          } else if (typeof MutationObserver === "undefined") {
            throw new Error("MutationObserver is not defined.  You must disable height autoupdate when your card activates with `this.consumers.height.autoUpdate = false`");
          }

          consumer.setUpAutoupdate();
        });
      },

      update: function (dimensions) {
        if (typeof dimensions === "undefined") {
          var width = 0,
              height = 0,
              childNodes = document.body.childNodes,
              len = childNodes.length,
              extraVSpace = 0,
              extraHSpace = 0,
              vspaceProps = ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'],
              hspaceProps = ['marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'],
              i,
              childNode;

          for (i=0; i < vspaceProps.length; ++i) {
            extraVSpace += parseInt(DomUtils.getComputedStyleProperty(document.body, vspaceProps[i]), 10);
          }

          for (i=0; i < hspaceProps.length; ++i) {
            extraHSpace += parseInt(DomUtils.getComputedStyleProperty(document.body, hspaceProps[i]), 10);
          }

          for (i = 0; i < len; ++i) {
            childNode = childNodes[i];
            if (childNode.nodeType !== Node.ELEMENT_NODE ) { continue; }

            width = Math.max(width, childNode.clientWidth + extraHSpace);
            height = Math.max(height, childNode.clientHeight + extraVSpace);
          }

          dimensions = {
            width: width,
            height: height
          };
        }

        this.send('resize', dimensions);
      },

      setUpAutoupdate: function () {
        var consumer = this;

        var mutationObserver = new MutationObserver(function () {
          consumer.update();
        });

        mutationObserver.observe(document.documentElement, {
          childList: true,
          attributes: true,
          characterData: true,
          subtree: true,
          attributeOldValue: false,
          characterDataOldValue: false,
          attributeFilter: ['style', 'className']
        });
      }
    });
  };

  Conductor.lifecycleConsumer = function(promise) {
    return Conductor.Oasis.Consumer.extend({
      initialize: function() {
        var consumer = this;

        promise.then(function() {
          consumer.send('activated');  
        });
      }
    });
  };

  Conductor.metadataConsumer = function(card) {
    var options = card.options;

    options.requests.metadataFor = function(resolver, name) {
      if (name === '*') {
        var promises = [], names = [], defered;

        for (var metadataName in options.metadata) {
          defered = Conductor.Oasis.RSVP.defer();
          card.metadata[metadataName].call(card, defered);
          promises.push(defered.promise);
          names.push(metadataName);
        }

        Conductor.Oasis.RSVP.all(promises).then(function(sources) {
          var metadata = {};

          for (var i = 0; i < sources.length; i++) {
            var name = names[i];
            for (var key in sources[i]) {
              metadata[name+':'+key] = sources[i][key];
            }
          }

          resolver.resolve(metadata);
        });

      } else {
        card.metadata[name].call(card, resolver);
      }
    };

    return Conductor.Oasis.Consumer.extend(options);
  };

  Conductor.nestedWiretapping = function (card) {
    return Conductor.Oasis.Consumer;
  };

  /*global DomUtils*/

  Conductor.renderConsumer = function(promise, card) {
    var options = Object.create(card.options);
    var domInitialized = false;

    function resetCSS() {
      var css = "",
          newStyle;

      css += "html, body {";
      css += "  margin: 0px;";
      css += "  padding: 0px;";
      css += "}";

      css += "iframe {";
      css += "  display: block;";
      css += "}";

      newStyle = DomUtils.createStyleElement(css);

      document.head.insertBefore(newStyle, document.head.children[0]);
    }

    options.events.render = function(args) {
      if(!domInitialized) {
        resetCSS();

        if(card.initializeDOM) {
          card.initializeDOM();
        }

        domInitialized = true;
      }
      card.render.apply(card, args);
    };

    return Conductor.Oasis.Consumer.extend(options);
  };

  /*global DomUtils*/

  Conductor.xhrConsumer = function(requiredUrls, requiredCSSUrls, promise, card) {
    var options = Object.create(card.options);

    options.initialize = function() {
      var promises = [],
          jsPromises = [],
          port = this.port;

      function loadURL(callback) {
        return function(url) {
          var promise = port.request('get', url);
          promises.push(promise);
          promise.then(callback);
        };
      }

      function processJavaScript(data) {
        var script = document.createElement('script');
        script.textContent = data;
        document.body.appendChild(script);
      }

      function processCSS(data) {
        var style = DomUtils.createStyleElement(data);
        document.head.appendChild(style);
      }

      requiredUrls.forEach( function( url ) {
        var promise = port.request('get', url);
        jsPromises.push( promise );
        promises.push(promise);
      });
      Conductor.Oasis.RSVP.all(jsPromises).then(function(scripts) {
        scripts.forEach(processJavaScript);
      });
      requiredCSSUrls.forEach(loadURL(processCSS));

      Conductor.Oasis.RSVP.all(promises).then(function() { promise.resolve(); });
    };

    return Conductor.Oasis.Consumer.extend(options);
  };

  Conductor.AssertionService = Conductor.Oasis.Service.extend({
    initialize: function(port) {
      this.sandbox.assertionPort = port;
    },

    events: {
      ok: function(data) {
        ok(data.bool, data.message);
      },

      equal: function (data) {
        equal(data.expected, data.actual, data.message);
      },

      start: function() {
        start();
      }
    }
  });

  Conductor.DataService = Conductor.Oasis.Service.extend({
    initialize: function(port) {
      var data = this.sandbox.data;
      this.send('initializeData', data);

      this.sandbox.dataPort = port;
    },

    events: {
      updateData: function(event) {
        this.sandbox.conductor.updateData(this.sandbox.card, event.bucket, event.object);
      }
    }
  });

  /*global DomUtils*/

  function maxDim(element, dim) {
    var max = DomUtils.getComputedStyleProperty(element, 'max' + dim);
    return (max === "none") ? Infinity : parseInt(max, 10);
  }

  Conductor.HeightService = Conductor.Oasis.Service.extend({
    initialize: function (port) {
      var el;
      if (el = this.sandbox.el) {
        Conductor.Oasis.RSVP.EventTarget.mixin(el);
      }
      this.sandbox.heightPort = port;
    },

    events: {
      resize: function (data) {
        // height service is meaningless for DOMless sandboxes, eg sandboxed as
        // web workers.
        if (! this.sandbox.el) { return; }

        var el = this.sandbox.el,
            maxWidth = maxDim(el, 'Width'),
            maxHeight = maxDim(el, 'Height'),
            width = Math.min(data.width, maxWidth),
            height = Math.min(data.height, maxHeight);

        el.style.width = width + "px";
        el.style.height = height + "px";

        el.trigger('resize', { width: width, height: height });
      }
    }
  });

  Conductor.LifecycleService = Conductor.Oasis.Service.extend({
    events: {
      activated: function() {
        this.sandbox.activateDefered.resolve();
      }
    }
  });

  Conductor.MetadataService = Conductor.Oasis.Service.extend({
    initialize: function(port) {
      this.sandbox.metadataPort = port;
    }
  });

  /**
    Passes requests from each instance to `upstream`, a
    `Conductor.Oasis.Consumer`, and sends the responses back to the instance.
    This differs from simply passing `upstream`'s port to nested cards in two
    ways:

      1. `upstream` can still be used within the current card and
      2. requests from multiple nested cards can be sent to `upstream`.

    This is useful for cards who cannot fulfill dependency requests of its child
    cards, but whose containing environment can.
  

    Example:

      Conductor.card({
        activate: function () {
          var conductor = new Conductor();

          // nested conductor cannot load required resources, but its containing
          // environment can (possibly by passing the request up through its own
          // multiplex service).
          conductor.services.xhr =  Conductor.MultiplexService.extend({
                                      upstream: this.consumers.xhr
                                    });

          // now the nested card can `Conductor.require` resources normally.
          conductor.card.load("/nested/card/url.js");
        }
      });
  */
  Conductor.MultiplexService = Conductor.Oasis.Service.extend({
    initialize: function () {
      this.port.all(function (eventName, data) {
        if (eventName.substr(0, "@request:".length) === "@request:") {
          this.propagateRequest(eventName, data);
        } else {
          this.propagateEvent(eventName, data);
        }
      }, this);
    },

    propagateEvent: function (eventName, _data) {
      var data = (typeof this.transformEvent === 'function') ? this.transformEvent(eventName, _data) : _data;
      this.upstream.send(eventName, data);
    },

    propagateRequest: function (eventName, _data) {
      var requestEventName = eventName.substr("@request:".length),
          port = this.upstream.port,
          data = (typeof this.transformRequest === 'function') ? this.transformRequest(requestEventName, _data) : _data,
          requestId = data.requestId,
          args = data.args,
          self = this;

      args.unshift(requestEventName);
      port.request.apply(port, args).then(function (responseData) {
        self.send('@response:' + requestEventName, {
          requestId: requestId,
          data: responseData
        });
      });
    }
  });

  Conductor.NestedWiretappingService = Conductor.Oasis.Service.extend({
    initialize: function (port) {
      this.sandbox.nestedWiretappingPort = port;
    }
  });

  Conductor.RenderService = Conductor.Oasis.Service.extend({
    initialize: function(port) {
      this.sandbox.renderPort = port;
    }
  });

  /*global PathUtils */

  Conductor.XHRService = Conductor.Oasis.Service.extend({
    requests: {
      get: function(promise, url) {
        var xhr = new XMLHttpRequest(),
            resourceUrl = PathUtils.cardResourceUrl(this.sandbox.options.url, url);

        xhr.onload = function(a1, a2, a3, a4) {
          if (this.status === 200) {
            promise.resolve(this.responseText);
          } else {
            promise.reject({status: this.status});
          }
        };
        xhr.open("get", resourceUrl, true);
        xhr.send();
      }
    }
  });

  /**
    Default Conductor services provided to every conductor instance.
  */
  Conductor.services = {
    xhr: Conductor.XHRService,
    metadata: Conductor.MetadataService,
    assertion: Conductor.AssertionService,
    render: Conductor.RenderService,
    lifecycle: Conductor.LifecycleService,
    data: Conductor.DataService,
    height: Conductor.HeightService,
    nestedWiretapping: Conductor.NestedWiretappingService
  };

  Conductor.capabilities = [
    'xhr', 'metadata', 'render', 'data', 'lifecycle', 'height',
    'nestedWiretapping'
  ];

  exports.Conductor = Conductor;
})(window, window.Oasis);