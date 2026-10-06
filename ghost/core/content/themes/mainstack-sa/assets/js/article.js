(function () {
    var content = document.querySelector(".gh-content");
    var toc = document.querySelector("[data-toc]");
    var list = document.querySelector("[data-toc-list]");

    if (content && toc && list) {
        var headings = content.querySelectorAll("h2, h3");

        if (headings.length >= 2) {
            headings.forEach(function (heading) {
                if (!heading.id) {
                    var base = heading.textContent
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "") || "section";
                    var id = base;
                    var n = 2;
                    while (document.getElementById(id)) {
                        id = base + "-" + n;
                        n += 1;
                    }
                    heading.id = id;
                }

                var item = document.createElement("li");
                if (heading.tagName === "H3") {
                    item.className = "toc-sub";
                }
                var link = document.createElement("a");
                link.href = "#" + heading.id;
                link.textContent = heading.textContent.trim();
                item.appendChild(link);
                list.appendChild(item);
            });

            toc.hidden = false;

            if ("IntersectionObserver" in window) {
                var links = list.querySelectorAll("a");
                var byId = {};
                links.forEach(function (link) {
                    byId[link.getAttribute("href").slice(1)] = link;
                });
                var observer = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) {
                            return;
                        }
                        links.forEach(function (link) {
                            link.removeAttribute("aria-current");
                        });
                        var current = byId[entry.target.id];
                        if (current) {
                            current.setAttribute("aria-current", "true");
                        }
                    });
                }, {rootMargin: "-20% 0px -70% 0px", threshold: 0});
                headings.forEach(function (heading) {
                    observer.observe(heading);
                });
            }
        }
    }

    var copyButton = document.querySelector("[data-copy-link]");
    var copyStatus = document.querySelector("[data-copy-status]");
    if (!copyButton) {
        return;
    }

    copyButton.addEventListener("click", function () {
        var url = window.location.href;
        var done = function (ok) {
            var message = ok ? "Link copied" : "Copy failed";
            copyButton.textContent = ok ? "Copied" : "Copy link";
            if (copyStatus) {
                copyStatus.textContent = message;
            }
            window.setTimeout(function () {
                copyButton.textContent = "Copy link";
                if (copyStatus) {
                    copyStatus.textContent = "";
                }
            }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                done(true);
            }).catch(function () {
                done(false);
            });
            return;
        }

        done(false);
    });
}());
