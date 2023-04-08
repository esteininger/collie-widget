"use strict";

const CONFIG = {
    category_allowed: { category: "Category", docs: "Documents" },
    category_default: null,
    category_send_as: "category=%category%",
    search_min_length: 1,
    // layoutHTML: "v1-collie-layout.html",
    layoutHTML: "https://dbkcgeg8vo92c.cloudfront.net/v1-collie-layout.html",
    base_api_url: "https://api.beta.mixpeek.com/v1"
};

class CollieWidget {
    button_src = null;
    category = null;
    config = {};
    on = false;
    searchController = null;
    searchHistoryHTML = "";
    searchResultRowHTML = "";
    searchTerm = "";
    searchTimeout = null;
    suggested = null;
    toggling = false;

    constructor({ api_key, div_id, suggested_pages, context }) {
        this.config = CONFIG;
        // constructor vars
        this.button_src = document.getElementById(div_id);
        this.config.mixpeek_auth = api_key;
        this.suggested_pages = suggested_pages;
        this.context = context;

        if (!this.button_src) {
            console.log("Could not find the div to bind");
            return;
        }

        this.fetchHTML()
            .then((data) => {
                this.button_src.innerHTML = data["button"];
                document.body.insertAdjacentHTML("beforeend", data["modal"]);
                this.suggested = data["suggested"];
                this.searchHistoryHTML = data["search_history"];
                this.searchResultRowHTML = data["result_row"];
                this.events();
            })
            .catch((error) => {
                this.button_src.innerHTML = `<span class="colwid_error">${error}</span>`;
            });
    }

    categorySet() {
        let category =
            this.button_src.dataset.category || this.config.category_default;

        if (category && category in this.config.category_allowed) {
            this.category = category;
            document.getElementById("colwid_category").style.display = "flex";
            document.querySelector("#colwid_category span").innerText =
                this.config.category_allowed[this.category];

            document
                .querySelector("#colwid_category button")
                .addEventListener("click", () => {
                    this.category = null;
                    document.getElementById("colwid_category").style.display = "none";
                    document.querySelector("#colwid_category span").innerText = "";
                });
        }
    }

    events(src) {
        //  Main click
        this.button_src.addEventListener("click", this.toggle.bind(this));

        //  Shortcuts
        document.addEventListener("keydown", this.shortcuts.bind(this), false);

        //  Click on the layer to close, need to check if it's not clicking on the main modal
        document
            .getElementById("colwid_modal")
            .addEventListener("click", this.toggleClick.bind(this));

        //  Main input focus / blur
        ["focus", "blur"].forEach((event_type) => {
            document
                .getElementById("colwid_input")
                .addEventListener(event_type, (event) => {
                    event.target.parentElement.classList.toggle("colwid_focus");
                });
        });

        //  Main input key up (search)
        document
            .getElementById("colwid_input")
            .addEventListener("keyup", this.searchStart.bind(this));

        //  Search back
        document
            .getElementById("colwid_back")
            .addEventListener("click", this.searchBack.bind(this));
    }

    async fetchHTML() {
        const layoutResponse = await fetch(this.config.layoutHTML);

        if (!layoutResponse.ok) {
            throw new Error("Could not fetch the HTML layout");
        }

        const layout = await layoutResponse.text();
        let items = layout.split(/<!--\[(.+)\]-->/gm),
            data = {};

        for (let x = 1; x <= 9; x = x + 2) {
            data[items[x]] = items[x + 1].trim();
        }

        return data;
    }

    htmlEncode(text) {
        var textArea = document.createElement("textarea");
        textArea.innerText = text;
        return textArea.innerHTML;
    }

    hasNestedKey(obj, key) {
        if (obj === null || typeof obj !== "object") {
            return false;
        }
        if (key in obj) {
            return true;
        }
        for (const nestedKey in obj) {
            if (this.hasNestedKey(obj[nestedKey], key)) {
                return true;
            }
        }
        return false;
    }

    mainSet() {
        let html = "",
            searchedSto = window.localStorage.getItem("searched");

        document.getElementById("colwid_loader").style.display = "none";

        if (searchedSto) {
            let searched = JSON.parse(searchedSto),
                searchedHTML = "";
            searched.forEach((searchedTerm) => {
                searchedHTML += this.searchHistoryHTML.replaceAll(
                    "%search_term%",
                    this.htmlEncode(searchedTerm)
                );
            });
            html += "<p>Recent Searches</p>" + searchedHTML;
        }

        // populate suggested items
        if (this.suggested_pages) {
            // header
            html += "<p>Suggested Pages</p>";
            this.suggested_pages.forEach((page) => {
                // replace each title
                html += this.suggested
                    .replaceAll("%suggested_title%", this.htmlEncode(page.title))
                    .replaceAll("%suggested_url%", this.htmlEncode(page.url));
                //TODO: replace each icon
            });
        }

        document.getElementById("colwid_content").innerHTML = html;

        //  Search history events
        if (searchedSto) {
            document.querySelectorAll(".search_history").forEach((e) => {
                e.addEventListener("click", this.searchHistory.bind(this));
            });
        }
    }

    search() {
        if (!this.searchTerm.trim().length) {
            this.searchBack();
        } else if (this.searchTerm.length >= this.config.search_min_length) {
            this.searchController = new AbortController();
            let url = `${this.config.base_api_url}/search?q=${this.searchTerm}&merge=true&limit=10`;

            // if (this.category) {
            //     url += "&" + this.category_send_as.replace("%category%", this.category);
            // }

            fetch(
                url,
                {
                    signal: this.searchController.signal,
                    headers: {
                        Authorization: this.config.mixpeek_auth,
                    },
                }
            )
                .then((response) => response.json())
                .then((data) => {

                    this.searchController = null;
                    document.getElementById("colwid_back").style.display = "block";
                    document.getElementById("colwid_loader").style.display = "none";
                    let html = "";
                    if (data.length) {
                        data.forEach((result) => {
                            console.log(result)

                            let resultRow = this.searchResultRowHTML;

                            // highlighting
                            if (result.contents) {
                                // Define the maximum length of the result text
                                const maxLength = 500;

                                if (result.contents.length >= maxLength) {
                                    result.contents = result.contents.substring(0, maxLength) + "...";
                                }

                                // replace %text% with the highlighted result text
                                resultRow = resultRow.replace("%text%", result.contents.trim());
                            } else {
                                // if there's no context, delete the section
                                resultRow = resultRow.replace(/<div>%text%<\/div>/, "");
                            }

                            // replace %importance% with the result importance
                            // resultRow = resultRow.replace(
                            //   "%importance%",
                            //   result.importance
                            // );

                            // importance
                            // resultRow = resultRow.replace(
                            //     "%importance%",
                            //     result.metadata.file_extension
                            // );

                            // replace href
                            if (this.hasNestedKey(result, "url")) {
                                resultRow = resultRow.replace(
                                    "%file_url%",
                                    result.metadata.url
                                );
                            } else {
                                resultRow = resultRow.replace("%file_url%", "#");
                            }

                            // handle preview
                            if (result.metadata.hasOwnProperty('preview_img') && result.metadata.preview_img.length > 0) {
                                resultRow = resultRow.replaceAll(
                                    "%file_extension%",
                                    `<img style="width:100%" src="${result.metadata.preview_img}">`
                                );
                            } else {
                                resultRow = resultRow.replace(
                                    "%file_extension%",
                                    `<img style="width:100%" src="https://dbkcgeg8vo92c.cloudfront.net/placeholder.png">`
                                );
                            }



                            // handle title
                            if (this.hasNestedKey(result, "title")) {
                                resultRow = resultRow.replaceAll(
                                    "%title%",
                                    result.metadata.title
                                );
                            } else {
                                resultRow = resultRow.replaceAll(
                                    "%title%",
                                    result.filename.trim()
                                );
                            }

                            html += resultRow;

                        });
                        let searchedSto = window.localStorage.getItem("searched"),
                            searched = searchedSto ? JSON.parse(searchedSto) : [];

                        if (!searched.includes(this.searchTerm)) {
                            searched.unshift(this.searchTerm);
                            if (searched.length > 3) {
                                searched = searched.slice(0, 3);
                            }
                            window.localStorage.setItem("searched", JSON.stringify(searched));
                        }
                    } else {
                        html = '<div class="not_found">No results match your search</div>';
                    }
                    document.getElementById("colwid_content").innerHTML = html;
                    document.getElementById("colwid_content").scrollTop = 0;
                });
        }
    }

    searchBack() {
        document.getElementById("colwid_input").value = "";
        document.getElementById("colwid_back").style.display = "none";
        this.searchTerm = "";
        this.mainSet();
    }

    searchHistory(e) {
        e.preventDefault();

        let target = e.target,
            searchTerm = target.dataset.searchterm;

        while (!searchTerm) {
            target = target.parentElement;
            searchTerm = target.dataset.searchterm;
        }

        let input = document.getElementById("colwid_input");
        input.value = searchTerm;
        input.dispatchEvent(new Event("keyup"));
    }

    searchStart(event) {
        this.searchTerm = event.target.value;

        document.getElementById("colwid_back").style.display = "none";

        if (this.searchTerm.trim().length) {
            document.getElementById("colwid_loader").style.display = "block";
        }

        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }

        if (this.searchController) {
            this.searchController.abort();
            this.searchController = null;
        }

        this.searchTimeout = setTimeout(this.search.bind(this), 500);
    }

    shortcuts(event) {
        //  ctrl + k
        if (event.ctrlKey && event.key === "k") {
            event.preventDefault();
            this.toggle();

            //  escape
        } else if (event.key === "Escape" && this.on) {
            this.toggle();
        }
    }

    toggle() {
        if (!this.toggling) {
            this.toggling = true;
            let modal = document.getElementById("colwid_modal");

            // document.body.style.marginRight = this.on ? "0px" : "15px";
            // document.body.style.overflow = this.on ? "auto" : "hidden";

            if (!this.on) {
                modal.style.display = "block";
                this.categorySet();
                this.mainSet();

                // dont focus on mobile
                const isMobile = {
                    Android: function () {
                        return navigator.userAgent.match(/Android/i);
                    },
                    BlackBerry: function () {
                        return navigator.userAgent.match(/BlackBerry/i);
                    },
                    iOS: function () {
                        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
                    },
                    Opera: function () {
                        return navigator.userAgent.match(/Opera Mini/i);
                    },
                    Windows: function () {
                        return (
                            navigator.userAgent.match(/IEMobile/i) ||
                            navigator.userAgent.match(/WPDesktop/i)
                        );
                    },
                    any: function () {
                        return (
                            isMobile.Android() ||
                            isMobile.BlackBerry() ||
                            isMobile.iOS() ||
                            isMobile.Opera() ||
                            isMobile.Windows()
                        );
                    },
                };

                if (!isMobile.any()) {
                    document.getElementById("colwid_input").focus();
                }
            }

            document.body.offsetHeight;
            modal.style.opacity = this.on ? 0 : 1;

            setTimeout(() => {
                this.toggling = false;
                if (this.on) {
                    this.searchBack();
                    modal.style.display = "none";
                }
                this.on = !this.on;
            }, 300);
        }
    }

    toggleClick(event) {
        if (event.target.className == "wrap_pfx") {
            this.toggle();
        }
    }
}
