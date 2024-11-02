'use strict';
const { Insect, Tree, InsectTree } = require('../models');
const data = [
  {
    insectName: 'Western Pygmy Blue Butterfly',
    treeName: 'General Sherman',
  },
  {
    insectName: 'Western Pygmy Blue Butterfly',
    treeName: 'General Grant',
  },
  {
    insectName: 'Western Pygmy Blue Butterfly',
    treeName: 'Lincoln',
  },
  {
    insectName: 'Western Pygmy Blue Butterfly',
    treeName: 'Stagg',
  },
  {
    insectName: 'Patu Digua Spider',
    treeName: 'Stagg',
  },
];
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    for (let i = 0; i < data.length; i++) {
      const { insectName, treeName } = data[i];

      let foundTree = await Tree.findOne({
        where: {
          tree: treeName,
        },
      });
      let foundInsect = await Insect.findOne({ where: { name: insectName } });
      console.log('Tree id', foundTree.id);
      console.log('Insect id:', foundInsect.id);

      await foundTree.addInsect(foundInsect);
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    for (let i = 0; i < data.length; i++) {
      let { treeName, insectName } = data[i];
      let tree = await Tree.findOne({ where: { tree: treeName } });
      let insect = await Insect.findOne({ where: { name: insectName } });
      if (tree != null && insect != null) {
        let item = await InsectTree.findOne({
          treeId: tree.id,
          insectId: insect.id,
        });
        if (item) {
          await item.destroy();
        }
      }
    }
  },
};
