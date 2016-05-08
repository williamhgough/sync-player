// =========================
// EXTERNAL IMPORTS
import "source-map-support/register";
import express from "express";
import http from "http";
import socketIo from "socket.io";
import chalk from "chalk";
import {Observable} from "rxjs";
// =========================
// INTERNAL IMPORTS
import "shared/operators";
import {ObservableSocket} from "shared/observable-socket";
import {UsersModule} from "./modules/users";
import {ChatModule} from "./modules/chat";
import {PlaylistModule} from "./modules/playlist";

// =========================
// ENV SETTINGS
const isDevelopment = process.env.NODE_ENV !== "production";

// =========================
// SETUP
const app = express();
const server = new http.Server(app);
const io = socketIo(server);

// =========================
// CLIENT WEBPACK
if (process.env.USE_WEBPACK === "true") {
    var webpackMiddleware = require("webpack-dev-middleware");
    var webpack = require("webpack");
    var clientConfig = require("../../webpack.client");
    var webpackHotMiddleware = require("webpack-hot-middleware");

    const compiler = webpack(clientConfig);
    app.use(webpackMiddleware(compiler, {
        publicPath: "/build/",
        stats: {
            colors: true,
            chunks: false,
            assets: false,
            timings: false,
            modules: false,
            hash: false,
            version: false
        }
    }));
    app.use(webpackHotMiddleware(compiler));
    console.log(chalk.bgRed("Using Webpack Dev Middleware! FOR DEV ONLY!"));
}

// =========================
// CONFIGURE EXPRESS
app.set("view engine", "jade");
app.use(express.static("public"));

const useExternalStyles = !isDevelopment;

app.get("/", (req, res) => {
    res.render("index", {
        useExternalStyles
    });
});

// =========================
// SERVICES
const videoServices = [];
const playlistRepository = {};

// =========================
// MODULES
const users = new UsersModule(io);
const chat = new ChatModule(io, users);
const playlist = new PlaylistModule(io, users, videoServices, playlistRepository);
const modules = [users, chat, playlist];


// =========================
// SOCKET
io.on("connection", socket => {
    console.log("Got connection from: " + socket.request.connection.remoteAddress);

    const client = new ObservableSocket(socket);
    
    for(let mod of modules) {
        mod.registerClient(client);
    }
    
    for(let mod of modules) {
        mod.clientRegistered(client);
    }
});


// =========================
// START
const port = process.env.PORT || 3000;
function startServer() {
    server.listen(port, () => {
        console.log("started http server on: " + port );
    });
}

Observable.merge(...modules.map(m => m.init$()))
    .subscribe({
        complete() {
            startServer();
        },
        error(error) {
            console.error('Could not init module: ' + (error.stack || error));
        }
    });
