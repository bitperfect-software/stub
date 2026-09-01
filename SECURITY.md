# Security policy

## Supported versions

Only the latest published version of `@bitperfect-software/stub` is supported. Fixes go out as a new
release; there are no backports.

| Version | Supported |
|---|---|
| latest | yes |
| everything else | no |

## Reporting a vulnerability

Report privately through GitHub Security Advisories:
<https://github.com/bitperfect-software/stub/security/advisories/new>. Please do not open a public
issue for a security problem.

Include the manifest and template files needed to reproduce it, the command you ran, and the versions
of `stub` and Node. You should get an acknowledgement within a few working days.

## Threat model — what is and is not a vulnerability

**`stub` executes Liquid templates from the project's own `.stub/` directory, so a hostile `.stub/` is
equivalent to hostile code in the repository. Treat template sources with the same trust as source
code.** A `.stub/` directory arrives the same way a build script or a test helper does: by cloning a
repository or installing a dependency you already decided to trust. `stub` renders it and writes the
result into the working tree.

Concretely, and by design rather than by oversight:

- A manifest `path` renders through Liquid, so it can point anywhere the invoking user can write,
  including outside the project root. There is no sandbox and no path allowlist.
- `stub` overwrites existing files without asking. There is no `--force` and no prompt.
- Template bodies can read whatever LiquidJS's own tags can read, relative to the `.stub/` directory.

None of the above is a vulnerability on its own. What *is* worth reporting:

- A way to make `stub` execute or write something a template does not ask for.
- A crash, hang or unbounded resource use reachable from a manifest that parses.
- Anything that makes a failed render leave a partially written tree — `stub` plans every write before
  it performs any of them, and that guarantee is meant to hold.
- A problem in a published tarball that is not in the repository, or a broken provenance attestation.
