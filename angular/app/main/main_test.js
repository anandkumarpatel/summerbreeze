'use strict';

describe('myApp.main module', function() {

  beforeEach(module('myApp.main'));

  describe('main controller', function(){

    it('should ....', inject(function($controller) {
      //spec body
      var main1Ctrl = $controller('Main1Ctrl');
      expect(main1Ctrl).toBeDefined();
    }));

  });
});