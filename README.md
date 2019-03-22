# jRouter
jQuery based router to create singel page applications

Web router to create single page applications and dynamically load html content
When the URL hash(http://www.mypage.com#hash) matches a pre-defined route pattern the content of that routes html page will be loaded into the given target. This creates a single page website where content is dynamically loaded into the same target frame.

### Initialize router
The router is automatically initialized and routing starts when the Router() function is called.

```javascript
jRouter({
    target: "#main-content",
    navbar: {
        selector: ".navbar",
        class: "active"
    },
    callbacks: {
        pre: function (route) { ... },
        success: function (route, response) { ... },
        error: function (route, xhr) { ... },
        complete: function (route) { ... }
    }
});
```

### Initialize router manually
Setting initialize to false prevents initialization.

```javascript
//Routing not started
jRouter({
    initialize: false
});
//Manually start router after options has been set,
jRouter.init();
```

### Add routing paths

```javascript
jRouter.add("/router", "html/router.html");
jRouter.add("/work-pool/info", "html/work-pool.html");
jRouter.add("404", "html/404.html");
```

### Add routing paths with parameters
```javascript
//Path with parameter id that matches everything
jRouter.add("router/{id}", "html/router.html");
//Path with parameter id that matches only digits
jRouter.add("table/{id:\\d+}", "html/table.html");
```

### Get parameters

```javascript
//Get all parameters
jRouter.getParameters();
//Get single parameter
jRouter.getParameter("id");
```

### Halt route.
Just return false in the pre callback.
```javascript
pre: function (route) {
    return false;
}
```

### Continue previously halted routing
```javascript
jRouter.continueRoute()
```

### Set and/or get a new path
This will trigger routing. Function always returns the current/updated path.
```javascript
//Set full path
jRouter.path("/tables/25");
//Add to path
jRouter.path("./subPath");
//Replace end of path
jRouter.path("../newPath");
//Just get path
var path = jRouter.path();
```

### Navigation bar interaction
If a navbar selector and class is given in the options the router will automatically update the active navbar link with the given class.
```javascript
jRouter({
    navbar: {
        selector: ".navbar",
        class: "active"
    }
});
```

### 404 handling
If an invalid route is given the routing 404 path will trigger. If no such path is added a default 404 page will be shown. 
