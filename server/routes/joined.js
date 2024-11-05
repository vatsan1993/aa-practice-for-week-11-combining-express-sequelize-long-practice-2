// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import models - DO NOT MODIFY
const { Insect, Tree, InsectTree } = require('../db/models');
const { Op } = require('sequelize');

/**
 * PHASE 7 - Step A: List of all trees with insects that are near them
 *
 * Approach: Eager Loading
 *
 * Path: /trees-insects
 * Protocol: GET
 * Response: JSON array of objects
 *   - Tree properties: id, tree, location, heightFt, insects (array)
 *   - Trees ordered by the tree heightFt from tallest to shortest
 *   - Insect properties: id, name
 *   - Insects for each tree ordered alphabetically by name
 */
router.get('/trees-insects', async (req, res, next) => {
  let trees = [];

  trees = await Tree.findAll({
    attributes: ['id', 'tree', 'location', 'heightFt'],
    include: {
      model: Insect,
    },
    order: [
      ['heightFt', 'DESC'],
      [Insect, 'name'],
    ],
  });
  let data = trees.filter((tree) => tree.Insects.length > 0);

  res.json(data);
});

/**
 * PHASE 7 - Step B: List of all insects with the trees they are near
 *
 * Approach: Lazy Loading
 *
 * Path: /insects-trees
 * Protocol: GET
 * Response: JSON array of objects
 *   - Insect properties: id, name, trees (array)
 *   - Insects for each tree ordered alphabetically by name
 *   - Tree properties: id, tree
 *   - Trees ordered alphabetically by tree
 */
router.get('/insects-trees', async (req, res, next) => {
  let payload = [];

  const insects = await Insect.findAll({
    attributes: ['id', 'name', 'description'],
    order: [['name']],
  });
  for (let i = 0; i < insects.length; i++) {
    const insect = insects[i];
    payload.push({
      id: insect.id,
      name: insect.name,
      description: insect.description,
      trees: await insect.getTrees({
        order: ['tree'],
        attributes: ['id', 'tree'],
      }),
    });
  }

  res.json(payload);
});

/**
 * ADVANCED PHASE 3 - Record information on an insect found near a tree
 *
 * Path: /associate-tree-insect
 * Protocol: POST
 * Parameters: None
 * Request Body: JSON Object
 *   - Property: tree Object
 *     with id, name, location, height, size
 *   - Property: insect Object
 *     with id, name, description, fact, territory, millimeters
 * Response: JSON Object
 *   - Property: status
 *     - Value: success
 *   - Property: message
 *     - Value: Successfully recorded information
 *   - Property: data
 *     - Value: object (the new tree)
 * Expected Behaviors:
 *   - If tree.id is provided, then look for it, otherwise create a new tree
 *   - If insect.id is provided, then look for it, otherwise create a new insect
 *   - Relate the tree to the insect
 * Error Handling: Friendly messages for known errors
 *   - Association already exists between {tree.tree} and {insect.name}
 *   - Could not create association (use details for specific reason)
 *   - (Any others you think of)
 */
// Your code here
router.post('/associate-tree-insect', async (req, res, next) => {
  let { tree, insect } = req.body;
  if (!tree) {
    res.status(404).json({
      status: 'error',
      message: 'Tree attribute not provided',
      details: 'You need to provide both Tree and insect',
    });
  }
  if (!insect) {
    res.status(404),
      json({
        status: 'error',
        message: 'insect attribute not provided',
        details: 'You need to provide both Tree and insect',
      });
  }
  let treeId = tree.id;
  let insectId = insect.id;
  let treeData, insectData;

  if (tree.id) {
    treeData = await Tree.findByPk(treeId);
  } else {
    const { location, heightFt, groundCircumferenceFt } = tree;
    try {
      treeData = await Tree.create({
        tree: tree.tree,
        location,
        heightFt,
        groundCircumferenceFt,
      });
    } catch (err) {
      next({
        status: 'error',
        message: err.message,
        details: err.errors
          ? err.errors.map((item) => item.message).join(', ')
          : err.message,
      });
    }
  }

  if (insect.id) {
    insectData = await Insect.findByPk(insectId);
  } else {
    const { name, description, fact, territory, millimeters } = insect;
    console.log(name, description, fact, territory, millimeters);

    try {
      insectData = await Insect.create({
        name,
        description,
        fact,
        territory,
        millimeters,
      });
    } catch (err) {
      next({
        status: 'error',
        message: err.message,
        details: err.errors
          ? err.errors.map((item) => item.message).join(', ')
          : err.message,
      });
    }
  }

  try {
    await treeData.addInsect(insectData);
    let data = await Tree.findByPk(treeData.id, {
      include: {
        model: Insect,
        through: InsectTree,
      },
    });
    res.json({
      status: 'success',
      message: 'Successfully recorded information',
      data,
    });
  } catch (err) {
    next({
      status: 'error',
      message: 'Could not create association',
      details: err.errors
        ? err.errors.map((item) => item.message).join(', ')
        : err.message,
    });
  }
});

// router.post('/associate-tree-insect', async (req, res, next) => {
//   const { tree, insect } = req.body;

//   try {
//     // Check or create tree
//     let treeInstance;
//     if (tree.id) {
//       treeInstance = await Tree.findByPk(tree.id);
//       if (!treeInstance) throw new Error(`Tree with id ${tree.id} not found`);
//     } else {
//       treeInstance = await Tree.create({
//         tree: tree.name,
//         location: tree.location,
//         heightFt: tree.height,
//         groundCircumferenceFt: tree.size,
//       });
//     }

//     // Check or create insect
//     let insectInstance;
//     if (insect.id) {
//       insectInstance = await Insect.findByPk(insect.id);
//       if (!insectInstance)
//         throw new Error(`Insect with id ${insect.id} not found`);
//     } else {
//       insectInstance = await Insect.create({
//         name: insect.name,
//         description: insect.description,
//         fact: insect.fact,
//         territory: insect.territory,
//         millimeters: insect.millimeters,
//       });
//     }

//     // Check for existing association
//     const existingAssociation = await InsectTree.findOne({
//       where: {
//         TreeId: treeInstance.id,
//         InsectId: insectInstance.id,
//       },
//     });

//     if (existingAssociation) {
//       return res.status(400).json({
//         status: 'error',
//         message: `Association already exists between ${treeInstance.tree} and ${insectInstance.name}`,
//       });
//     }

//     // Create the association
//     await treeInstance.addInsect(insectInstance);

//     res.json({
//       status: 'success',
//       message: 'Successfully recorded information',
//       data: treeInstance,
//     });
//   } catch (error) {
//     // Return a friendly error message
//     res.status(400).json({
//       status: 'error',
//       message: 'Could not create association',
//       details: error.message,
//     });
//   }
// });

// Export class - DO NOT MODIFY
module.exports = router;
