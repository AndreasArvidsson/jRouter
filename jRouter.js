/*
 * jRouter
 * https://github.com/AndreasArvidsson/jRouter
 * @author Andreas Arvidsson 2019
 */

+function () {
    "use strict";

    if (typeof $ === "undefined") {
        throw new Error("jRouter: jQuery is required.");
    }

    /* ------------------- PRIVATE DATA MEMBERS ------------------- */

    let  _initialized = false;
    let  _target = null;
    let  _routes = [];
    let  _lastRoute = "";
    let  _skipRoutingOnce = false;
    let  _haltedRoute = undefined;
    let  _params = {};
    let  _userOptions = null;
    let  _options = {
        initialize: true,
        navbar: {},
        callbacks: {}
    };

    /* ------------------- PUBLIC FUNCTIONS ------------------- */

    function jRouter(options) {
        if (!options) {
            throw new Error("jRouter: Options are required.");
        }

        _userOptions = options;

        //Add prefix if not present.
        if (!location.hash.length) {
            setUrl("/");
        }

        if (options.initialize !== false) {
            jRouter.init();
        }
    }

    /**
     * Initialize/start the jRouter.
     */
    jRouter.init = function () {
        if (!_initialized) {
            if (_userOptions === null) {
                throw new Error("jRouter: Options are required. Please run Router()");
            }

            $.extend(_options, _userOptions);

            enableEventListener();
            _initialized = true;

            //Do routing when page is done loading.
            $(doRouting);
        }
    };


    /**
     * Add new route.
     * @param {string} path - Path to match hash url against
     * @param {string} file - URL to HTML file.
     */
    jRouter.add = function (path, file) {
        if (!path || !file) {
            console.error("jRouter: path and file is required");
        }
        path = path.trim();
        let  tokensTmp = tokenize(path);
        let  tokens = [];
        let  numLiteralChars = 0;
        let  numIds = 0;
        let  numRegexIds = 0;
        for (let  i = 0; i < tokensTmp.length; ++i) {
            let  value = tokensTmp[i];
            let  token = {
                isId: isId(value)
            };
            if (token.isId) {
                ++numIds;
                token.value = getId(value);
                if (hasIdRegex(value)) {
                    ++numRegexIds;
                    token.regex = getIdRegex(value);
                }
            }
            else {
                numLiteralChars += value.length;
                token.value = value;
            }
            tokens.push(token);
        }
        _routes.push({
            path: path,
            tokens: tokens,
            file: file.trim(),
            numLiteralChars: numLiteralChars,
            numIds: numIds,
            numRegexIds: numRegexIds
        });
    };

    /**
     * Get list of route parameters.
     * @returns {id:value, id:value...}
     */
    jRouter.getParameters = function () {
        return jQuery.extend(true, {}, _params);
    };

    /**
     * Get a single parameter value based on its id.
     * @returns String
     */
    jRouter.getParameter = function (id) {
        return _params[id];
    };

    /**
     * Continue the previously halted routing. 
     * @returns {undefined}
     */
    jRouter.continueRoute = function () {
        if (_haltedRoute) {
            setUrlNoEvent(_haltedRoute.url);
            doLoading(_haltedRoute);
        }
        else {
            console.warn("jRouter: Can't continue route. No halted route available.");
        }
    };

    /**
     * Programatically update the current path. Routing will be performed.
     * @param {string} path
     */
    jRouter.path = function (path) {
        if (path) {
            let hash = location.hash;
            //Remove trailing /
            if (hash.endsWith("/")) {
                hash = hash.slice(0, hash.length - 1);
            }
            //Add this path to the previous.
            if (path.startsWith("./")) {
                path = location.hash + path.slice(1);
            }
            //Replace parent path.
            else if (path.startsWith("../")) {
                while (path.startsWith("../")) {
                    hash = hash.slice(0, hash.lastIndexOf("/"));
                    path = path.slice(3);
                }
                path = hash + "/" + path;
            }
            location.hash = path;
        }
        return location.hash.slice(1);
    };

    //Expose router to global scope.
    window.jRouter = jRouter;

    /* ------------------- PRIVATE FUNCTIONS ------------------- */

    function updateNavbar() {
        let navbar = $(_options.navbar.selector);
        if (navbar.length) {
            const cssClass = _options.navbar.class;
            //Remove active from previous link.
            navbar.find("." + cssClass).removeClass(cssClass);
            const href = location.hash.length ? location.hash : "#";
            //Find new link.
            const newLink = navbar.find('[href$="' + href + '"]');
            //Set new link parent as active.
            if (_options.navbar.parent) {
                newLink.parent().addClass(cssClass);
            }
            //Set new link as active.
            else {
                newLink.addClass(cssClass);
            }
        }
    }

    function getTarget() {
        if (!_target) {
            _target = $(_options.target);
            if (!_target.length) {
                throw new Error("jRouter: Target \"" + _options.target + "\" not found.")
            }
        }
        return _target;
    }

    function tokenize(str) {
        return str.split("/").filter(Boolean);
    }

    function isId(str) {
        return /^{.*}$/.test(str);
    }

    function setUrl(url) {
        location.hash = "#" + url;
    }

    function setUrlNoEvent(url) {
        _skipRoutingOnce = true;
        setUrl(url);
    }

    function matchStr(expToken, foundStr) {
        return expToken.value === foundStr;
    }

    function matchId(expToken, foundId) {
        if (expToken.regex) {
            return expToken.regex.test(foundId);
        }
        else {
            return foundId ? true : false;
        }
    }

    function hasIdRegex(idToken) {
        return idToken.indexOf(":") !== -1;
    }

    function getIdRegex(idToken) {
        return new RegExp(idToken.substring(idToken.indexOf(":") + 1, idToken.length - 1));
    }

    function getId(idToken) {
        let  index = idToken.indexOf(":");
        if (index !== -1) {
            return idToken.substring(1, index);
        }
        else {
            return idToken.substring(1, idToken.length - 1);
        }
    }

    function clearParams() {
        _params = {};
    }

    function calculateParams(route, urlTokens) {
        let  params = {};
        for (let  i = 0; i < route.tokens.length; ++i) {
            if (route.tokens[i].isId) {
                params[route.tokens[i].value] = urlTokens[i];
            }
        }
        return params;
    }

    function sortRoutes(routes) {
        routes.sort(function (a, b) {
            //First. Sort by number of string literals.
            if (a.numLiteralChars > b.numLiteralChars) {
                return -1;
            }
            if (a.numLiteralChars < b.numLiteralChars) {
                return 1;
            }
            //Seconds. Sort by number of IDs.
            if (a.numIds > b.numIds) {
                return -1;
            }
            if (a.numIds < b.numIds) {
                return 1;
            }
            //Third. Sort by num of regex IDs.
            if (a.numRegexIds > b.numRegexIds) {
                return -1;
            }
            if (a.numRegexIds < b.numRegexIds) {
                return 1;
            }
            //Default, both are equal.
            return 0;
        });
    }

    function isRouteValid(route, urlTokens) {
        let  routeTokens = route.tokens;
        //Length differs.
        if (routeTokens.length !== urlTokens.length) {
            return false;
        }
        for (let  i = 0; i < routeTokens.length; ++i) {
            //Match id.
            if (routeTokens[i].isId) {
                if (!matchId(routeTokens[i], urlTokens[i])) {
                    return false;
                }
            }
            //Match string.  
            else if (!matchStr(routeTokens[i], urlTokens[i])) {
                return false;
            }
        }
        return true;
    }

    function findRoute(url) {
        let  urlTokens = tokenize(url);

        let  validRoutes = [];
        for (let  i = 0; i < _routes.length; ++i) {
            if (isRouteValid(_routes[i], urlTokens)) {
                validRoutes.push(_routes[i]);
            }
        }

        //Sort valid routes to get the best match.
        sortRoutes(validRoutes);

        if (validRoutes.length) {
            let  route = validRoutes[0];
            return {
                url: url,
                path: route.path,
                file: route.file,
                params: calculateParams(route, urlTokens)
            };
        }

        return null;
    }

    function doRouting() {
        let  url = location.hash.slice(1);
        let  route = findRoute(url);

        //Do routing.
        if (route) {
            loadRoute(route);
        }
        //Show 404 message.
        else {
            route = findRoute("404");

            //Load custom 404 page.
            if (route) {
                loadRoute(route);
            }
            //Use default 404 message.
            else {
                //Default message has no params.
                clearParams();
                getTarget().html("<h1>Error 404<br><small>Page not found</small></h1>");
            }
        }
    }

    function loadRoute(route) {
        //Call pre callback if available.
        if (_options.callbacks.pre) {
            let  res = _options.callbacks.pre(route);
            //Pre callback returned false. Halt loading new page and stay on current route.
            if (res === false) {
                //Return route context in URL to previous. IE the page we are staying one.
                setUrlNoEvent(_lastRoute.url);
                //Store halted route so we can continue later.
                _haltedRoute = route;
                return;
            }
        }
        //Continue with loading page.
        doLoading(route);
    }

    function doLoading(route) {
        _params = route.params;
        _lastRoute = route;
        _haltedRoute = undefined;

        //Update the navbar with the new path.
        updateNavbar();

        let  target = getTarget();
        target.load(route.file, function (response, status, xhr) {
            //Failed to load page.
            if (status === "error") {
                //If the page couldn't be loaded. Just clear the target.
                target.empty();
                //Clear params on error.
                clearParams();
                //Call error callback if available.
                if (_options.callbacks.error) {
                    _options.callbacks.error(route, xhr);
                }
            }
            //Page loaded succesfully
            else {
                //Format the document.
                formatDocument(target);
                //Call success callback if available.
                if (_options.callbacks.success) {
                    _options.callbacks.success(route, response);
                }
            }
            //Call complete callback if available.
            if (_options.callbacks.complete) {
                _options.callbacks.complete(route);
            }

            //Scroll to top.
            target.scrollTop(0);
        });
    }

    function enableEventListener() {
        $(window).on('hashchange', function () {
            if (_skipRoutingOnce) {
                _skipRoutingOnce = false;
            }
            else {
                doRouting();
            }
        });
    }

}();