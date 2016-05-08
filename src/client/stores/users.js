import _ from "lodash";
import {Observable} from "rxjs";
import {validateLogin} from "shared/validation/users";


export class UsersStore {
    get currentUser() { return this.currentUser; }
    get isLoggedIn() { return this.currentUser && this._currentUser.isLoggedIn; }
    
    constructor(server) {
        this._server = server;
        
        const events$ = Observable.merge(
            this._server.on$("users:list").map(opList),
            this._server.on$("users:added").map(opAdd),
            this._server.on$("users:removed").map(opRemove)
            );
        
        // Users list
        const defaultStore = {users: []};
        this.state$ = events$
            .scan(({state}, op) => op(state), {state: defaultStore})
            .publishReplay(1);
            
        this.state$.connect();
        
        // Auth
        this.currentUser$ = Observable.merge(
            this._server.on$("auth:login"),
            this._server.on$("auth:logout").mapTo({}))
            .startWith({})
            .publishReplay(1)
            .refCount();
            
        this.currentUser$.subscribe(user => this._currentUser = user);
        
        // Bootstrap
        this._server.on("connect", () => {
            this._server.emit("users:list");
        });
    }
    
    login$(name) {
        const validator = validateLogin(name);
        if(validator.hasError) {
            return Observable.throw({message: validator.message});
        }
        
        return this._server.emitAction$("auth:login", {name});
    }
    
    logout$() {
        return this._server.emitAction$("auth:logout");
    }
}

function opList(users) {
    return state => {
        state.users = users;
        state.users.sort((l, r) => l.name.localeCompare(r.name));
        return {
            type: "list",
            state: state
        };
    };
}

function opAdd(user) {
    return state => {
        let insertIndex = _.findIndex(state.users,
            u => u.name.localeCompare(user.name) > 0);
            
        if(insertIndex === -1) {
            insertIndex = state.users.length;           
        }
        
        state.users.splice(insertIndex, 0, user);
        return {
            type: "add",
            user: user,
            state: state
        };
    };
}

function opRemove(user) {
    return state => {
        const index = _.findIndex(state.users, { name: user.name });
        
        if(index !== -1) {
            state.users.splice(index, 1);
        }
        
        return {
            type: "remove",
            user: user,
            state: state
        };
    };
}

