module.exports = (function() {

  "use strict";

  const Nodal = require('nodal');

  class CreateRecipes extends Nodal.Migration {

    constructor(db) {
      super(db);
      this.id = 2016062121165976;
    }

    up() {

      return [
        this.createTable("recipes", [{"name":"trigger_channel","type":"string"},{"name":"trigger_name","type":"string"},{"name":"trigger_fields","type":"string"},{"name":"action_channel","type":"string"},{"name":"action_name","type":"string"},{"name":"action_fields","type":"string"},{"name":"user_id","type":"string"}])
      ];

    }

    down() {

      return [
        this.dropTable("recipes")
      ];

    }

  }

  return CreateRecipes;

})();
