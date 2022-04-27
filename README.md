# Heroku Git Push

A simple GitHub Action that will push the main branch to the Heroku remote. Using GitHub secrets you can securely use your Heroku credentials to push changes from your main branch to multiple Heroku apps.

## Important Notes

- Only works for branches named `main` or `master` by default
- The use of `fetch-depth: 0` ensures Heroku will accept the push. See [this changelog](https://devcenter.heroku.com/changelog-items/775) for details.

## Usage

Create a workflow in `.github/workflows` called `main.yml`.

```yaml
name: Heroku push

on:
  push:
    branches:
      - main

jobs:
  heroku_git_push:
    runs-on: ubuntu-latest
    name: Push code to Heroku
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - name: Push code
        uses: yunojuno/heroku-git-push@v1
        with:
          email: ${{ secrets.HEROKU_PUSH_EMAIL }}
          api_key: ${{ secrets.HEROKU_PUSH_API_KEY }}
          app_names: |
            app_name1
            app_name2
```

## Inputs

### `email` **_REQUIRED_**

The email that will be used to push code to Heroku.

It is recommended that you store this as a [GitHub Secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

### `api_key` **_REQUIRED_**

API key used to authenticate with Heroku.

It is recommended that you store this as a [GitHub Secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

### `app_names` **_REQUIRED_**

An array of Heroku app names that the branch should be deployed to.

### `debug` _OPTIONAL_

Prints extra logs from Heroku CLI and git commands, which should help in cases where things aren't working and the error messages don't help.
