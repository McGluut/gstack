# Fork Launch Copy

Use this copy when introducing the fork publicly. Keep the claim narrow: original workflow credit belongs to Garry Tan's `gstack`; this fork claims portability, explicit contracts, honest fallback behavior, and reliable default verification.

## X Post

Forked @garrytan's gstack and hardened it for off-the-shelf use across agent runtimes.

Same core workflow; clearer skill contracts, portable install/state paths, honest fallbacks, and a default test gate that passes on Windows.

https://github.com/mcgluut/gstack

## GitHub Entry Summary

This is a portable fork of Garry Tan's `gstack`.

The original repo introduced the workflow: a software-factory stack of agent skills for planning, review, QA, security, design, release, and browser-backed verification.

This fork keeps that workflow and hardens the delivery surface:

- Skills expose prerequisites, outputs, stop conditions, and fallback behavior near the top.
- Helper paths, install layouts, state roots, and temp roots avoid maintainer-machine assumptions.
- Generated skill outputs stay fresh across supported hosts.
- The default verification path is explicit and passes through `bun test`, including on Windows.
- Public docs explain how users and agents should report hidden assumptions or unclear contracts.

Use upstream to understand the original gstack vision. Use this fork when you want an off-the-shelf distribution that is easier to install, inspect, verify, and adapt across agent runtimes.

