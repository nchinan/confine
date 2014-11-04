confine
--

[![Build Status](https://travis-ci.org/nchinan/confine.svg)](https://travis-ci.org/nchinan/confine)

Solves the problem of using multiple versions of javascript libraries and executing arbitrary javascript in isolated namespaces.

Invoking `confine` will return an `isolate`.  An isolate is an context where you can execute javascript code in confinement to your global namespace.

#### Install

<pre>
bower install confine
</pre>

##### Running Tests

<pre>
npm install
bower install
grunt
</pre>

#### Usage

<pre>
var isolate = confine(options, source, callbacks, error);
</pre>

##### Confine Parameters

<b>options (object)</b>

* <b>name (string)</b> - a unique name for the isolate.  If this is not specified a name will be generated.
* <b>path (string)</b> - the base path for dependencies.
* <b>deps (object)</b> - an key value pair where keys are the global object name and the value is the path relative to `path`.
* <b>parameters (array)</b> - An array of key value pairs where the key is the parameter name and value is the value of the parameter.  These parameters are global to the sources you provide.

<b>source (string)</b> - source code to be executed in the isolate.  You can access your `parameters` with in the source.

<b>source (object)</b>

  * <b>attach (bool)</b> - attaches script (if function body) to isolate (see isolate's `invoke` method).
  * <b>source</b> source code to executed in the isolate.

<b>source (array)</b> - and array of source objects.

<b>callbacks (array)</b> - an array of key value pairs where keys are the function names and values are functions to be invoked within source code.

<b>error (function)</b> - a callback for error handling.

#### Isolate (object)

The following methods are accessible if you have <em>attached</em> your source to the isolate.

<b>invoke(name, [arg,...]) (method)</b> - invokes a method (called `name`) and passes in arguments `[arg,...]`.

<b>get(name) (method)</b> - gets value of object (called `name`).

<b>set(name, value) (method)</b> - sets value of object (called `name`).

</table>
