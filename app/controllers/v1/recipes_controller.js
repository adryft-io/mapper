module.exports = (function() {

  'use strict';

  const Nodal = require('nodal');
  const Recipe = Nodal.require('app/models/recipe.js');

  class V1RecipesController extends Nodal.Controller {

    index() {

      // this.respond(this.params.query.query);this.paras
      Recipe.query()
        .where(this.params.query)
        .end((err, models) => {
          this.respond(err || models);
        });

    }

    show() {

      Recipe.find(this.params.route.id, (err, model) => {

        this.respond(err || model);

      });

    }

    create() {

      Recipe.create(this.params.body, (err, model) => {

        this.respond(err || model);

      });

    }

    update() {

      Recipe.update(this.params.route.id, this.params.body, (err, model) => {

        this.respond(err || model);

      });

    }

    destroy() {

      Recipe.destroy(this.params.route.id, (err, model) => {

        this.respond(err || model);

      });

    }

  }

  return V1RecipesController;

})();
