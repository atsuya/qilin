Qilin
=====

[![Build
Status](https://secure.travis-ci.org/atsuya/qilin.png)](http://travis-ci.org/atsuya/qilin)

** NOTE: THIS PROJECT IS HEAVILY IN DEVELOPMENT, EXPERIMENTAL AND UNSTABLE **

Unicorn-like monitoring for node.js.


What is it?
===========

[Unicorn](http://unicorn.bogomips.org/) is a great HTTP server that allows you to do no downtime deployment. It also allows you to run multiple rack applications on the same IP/port combination with child processes it spawns, and it automatically resurrects the process it dies. That is awesome and ``Qilin`` is that for node.js.


How does it work?
=================

The basics are the same as unicorn and you can find articles that talks about its architectures [here](https://github.com/blog/517-unicorn) and [there](http://tomayko.com/writings/unicorn-is-unix). The main difference is that most of good stuff is coming from ``cluster`` module.

Cluster module is like your boss and it monitors what happens in its workers. For example, when http server listens on some port on one of worker processes, then the boss (master process) looks at what port it is about to listen. If it already has a handler that matches with the port, then it gives the worker the handler that is already being open. This means that if multiple workers listen on the same port, they all share the handler. This way, we can let OS do load balancing. If you want to know more about it, you can just read the [cluster documentation](http://nodejs.org/api/cluster.html). It also provides you with a way for master process and workers to communicate.
It will be notified when certain worker died and things in that sort.

So basically, all ``qilin`` does is leveraging cluster module to manage workers.


How to gracefully restart?
==========================

Just like unicorn, just send ``SIGUSR2`` signal to the master process. All connections that are currently processed will stay connected until they go through, and new workers will be spawned and handling new requests. If the file specified to start ``qilin`` has been modified, the workers will load the modified one.


Install
=======
```
$ npm install -g qilin
```


examples
========
```
$ qilin -w 3 /path/to/your/node/file.js
```

The example above will start ``/path/to/your/node/file.js`` with 3 workers.

If you want to use ``qilin`` programmatically, then you can do this:

```
var Qilin = require('qilin');
var qilin = new Qilin(
    {
        exec: '/path/to/your/nodejs/file.js'
      , args: []
      , silent: false
    }
  , {
        workers: 3
    }
);
qilin.start(function() {
  console.log('Qilin is started!');
});
```

This example will start ``/path/to/your/nodejs/file.js`` with 3 workers.


Methods
=======

Will do later...


License
========

MIT
