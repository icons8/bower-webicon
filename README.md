This repo is for distribution on `npm` and `bower`. The source for this module is in the
[main i8-icon repo](https://github.com/icons8/i8-icon).
Please file issues and pull requests against that repo.

## Installing Icons8 icons

You can install this package locally either with `npm`, `bower`, or `jspm`.

### npm

```shell
npm install i8-icon
```

Now you can use `require('i8-icon')` when installing with npm or jsmp and using Browserify or Webpack.

### bower

```shell
# To get the latest stable version, use bower from the command line.
bower install i8-icon

# To get the most recent, last committed-to-master version use:
bower install i8-icon#master 

# To save the bower settings for future use:
bower install i8-icon --save

# Later, you can use easily update with:
bower update
```

> Please note that i8-icon requires **Angular 1.1.x** or higher for use as Angular module.
> Please note that i8-icon requires **jQuery 1.4.x** or higher for use as jQuery plugin.


### Using the i8-icon Library

Now that you have installed the Angular libraries, simply include the scripts and 
stylesheet in your main HTML file, in the order shown in the example below. Note that npm 
will install the files under `/node_modules/i8-icon/` and bower will install them 
under `/bower_components/i8-icon/`.
