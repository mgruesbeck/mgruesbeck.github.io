#melvingruesbeck.com

###TODO

- Refactoring
  - Add documentation: stack details
  - Remove Bower

- Post ideas
  - Random experiments with real data visualized with ggplot or d3
  - Language simplification 

- Portfolio content
  - UX example: survey research
  - UI examples: metamind
  - Print design
  - Front-end code
  - Photos

### Install
```shell
$ npm install
$ bower install
```

### Build
```shell
$ npm run build
```

### Deploy

```shell
$ aws s3 cp build --profile nixie s3://www.melvingruesbeck.com --recursive --acl public-read
```
