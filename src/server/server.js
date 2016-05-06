import "source-map-support/register";
import express from "express";
import http from "http";
import socketIo from "socket.io";
import chalk from "chalk";

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
// MODULES

// =========================
// SOCKET
io.on("connection", socket => {
    console.log("Got connection from: " + socket.request.connection.remoteAddress);
});

// =========================
// START
const port = process.env.PORT || 3000;
function startServer() {
    server.listen(port, () => {
        console.log("started http server on: " + port );
    });
}
startServer();
