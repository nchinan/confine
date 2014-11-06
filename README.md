confine
--

[![Build Status](https://travis-ci.org/nchinan/confine.svg)](https://travis-ci.org/nchinan/confine)

Solves the problem of using multiple versions of javascript libraries and executing arbitrary javascript in isolated namespaces.

Invoking `confine` will return an `isolate`.  An isolate is an context where you can execute javascript code in confinement to your global namespace.

#### Install

<pre>
bower install confine
</pre>

##### Running Tests/Building

<pre>
npm install
bower install
grunt
</pre>

#### Usage

<pre>
var isolate = confine(options, source, callbacks, error);
</pre>

##### <em>Confine (function)</em>

returns an `isolate` object

<b>options (object)</b>

* <b>name (string)</b> - A unique name for the isolate.  If this is not specified a name will be generated.
* <b>path (string)</b> - The base path for dependencies.
* <b>deps (object)</b> - A key value pair where keys are the global object name and the value is the path relative to `path`.
* <b>depends (object)</b> - A key value pair where keys are the global object (defined in `deps`) and the value is an array of global objects that the key depends on.
* <b>parameters (array)</b> - An array of key value pairs where the key is the parameter name and value is the value of the parameter.  These parameters are global to the sources you provide.

<b>source (string)</b> - Source code to be executed in the isolate.  You can access your `parameters` within the source.

<b>source (object)</b>

  * <b>attach (bool)</b> - Attaches script (if function body) to isolate (see isolate's `invoke` method).
  * <b>source</b> source code to executed in the isolate.

<b>source (array)</b> - An array of source objects.

<b>callbacks (array)</b> - An array of key value pairs where keys are the function names and values are functions to be invoked within source code.

<b>error (function)</b> - A callback for error handling.

##### <em>Isolate (object)</em>

The following methods are accessible if you have <em>attached</em> your source to the isolate.

<b>invoke(name, [arg,...]) (function)</b> - invokes a method (called `name`) and passes in. arguments `[arg,...]`. This will return a promise with signature `.then(success, error)`, e.g.
<pre>
var isolate = confine(...,
  {
      attach: true,
      source: "return { a: function(b) { return b; } }"
  },
..);

isolate.invoke(a, [1]).then(function(value) {
    console.log(value); // 1
  });

</pre>

<b>destroy (function)</b> - removes the isolate and container.

</table>
