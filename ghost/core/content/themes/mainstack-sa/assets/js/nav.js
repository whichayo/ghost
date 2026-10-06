(function () {
    var toggle = document.querySelector("[data-blog-nav-toggle]");
    var nav = document.querySelector("[data-blog-nav]");
    if (!toggle || !nav) {
        return;
    }

    var desktop = window.matchMedia("(min-width: 800px)");

    function setOpen(open) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
            setOpen(false);
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            setOpen(false);
        }
    });

    desktop.addEventListener("change", function (event) {
        if (event.matches) {
            setOpen(false);
        }
    });

    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    nav.querySelectorAll("a[href]").forEach(function (link) {
        var url;
        try {
            url = new URL(link.href, window.location.origin);
        } catch (error) {
            return;
        }
        if (url.origin !== window.location.origin) {
            return;
        }
        var target = url.pathname.replace(/\/+$/, "") || "/";
        if (target === path) {
            link.setAttribute("aria-current", "page");
        }
    });
}());
