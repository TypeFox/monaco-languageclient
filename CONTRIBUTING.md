### Contributing

- Contributions to catch up with latest versions of LSP and Monaco are always welcomed!
- Contributions to propose a new example should be only accepted if an author is ready to become a maintainer
and help with upgrading and testing it with latest versions of LSP and Monaco.

### Maintaining

The project is maintained by individuals using for its own purposes and being ready to help as it suites them.
There is no guarantee on time of response to issues and pull requests.

#### Current Maintainers

- @AlexTugarev - Alex Tugarev
- @gatesn - Nicholas Gates
- @mofux - Thomas Zilz
- @akosyakov - Anton Kosyakov
- @BroKun - Yukun Wang
- @rcjsuen - Remy Suen
- @asual - Rostislav Hristov
- @zewa666 - Vildan Softic
- @johnwiseheart - John Wiseheart
- @RomanNikitenko - Roman Nikitenko
- @azatsarynnyy - Artem Zatsarynnyi

#### How to become a maintainer?

If you are using the project and would like to push it forward, please comment on [this issue](https://github.com/TypeFox/monaco-languageclient/issues/164).
Other maintainers can add you as a collaborator with `Admin` access.
A new maintainer should be listed as [a current maintainer](#current-maintainers) above and as [a code owner](.github/CODEOWNERS).

### Releasing

For simplicity, each release should bump the minor version.

- Publish:
  - `npm login`
  - `yarn publish:latest`
- Update [Changelog](./CHANGELOG.md)

#### Next Releases

Travis auto publishes next version on each commmit to the master branch. One can install it as `monaco-languageclient@next`.

#### Dev Releases

For testing purporses from a pull request, one can publish `dev` version with `yarn publish:dev`. One can install it as `monaco-languageclient@dev`.
