import $ from "jquery";
import "shared/operators";
import "./application.scss";
import * as services from "./services";

// =========================
// PLAYGROUND
services.server.emitAction$("login", {
    username: "foo",
    password: "bar"
}).subscribe(user => {
    console.log(user);
}, error => {
    console.error(error);
});
// =========================
// AUTH
const $html = $("html");
services.usersStore.currentUser$.subscribe(user => {
    if (user.isLoggedIn) {
        $html.removeClass("not-logged-in");
        $html.addClass("logged-in");
    } else {
        $html.addClass("not-logged-in");
        $html.removeClass("logged-in");
    }
});

// =========================
// COMPONENTS
require("./components/player/player");
require("./components/users/users");
require("./components/chat/chat");
require("./components/playlist/playlist");

// =========================
// BOOTSTRAP
services.socket.connect();
