# Domain model
This /model folder should only include models/abstractions (interface, enum, type, etc.) to avoid potential circular dependency. <br />
(Abstractions should not depend on details. Details (concrete implementations) should depend on abstractions.)

 Implementations depend on this /model folder to avoid cases like depending on each other for interfaces models.

## TODO
maybe we can introduce path aliases (https://levelup.gitconnected.com/path-aliases-with-typescript-in-node-js-230803e3f200)

So it can use path alias to import model outside of the folder in a cleaner way like this:
```
import { LanguageName } from '@lsp/model';
```
