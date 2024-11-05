// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

/**
 * INTERMEDIATE BONUS PHASE 2 (OPTIONAL) - Code routes for the insects
 *   by mirroring the functionality of the trees
 */
// Your code here
const { Insect, Tree } = require('../db/models');
const { Op } = require('sequelize');
// List of insects returning id, name, and millimeters ordered by millimeters from smallest to largest
router.get('/', async (req, res, next) => {
  let insects = await Insect.findAll({
    attributes: ['id', 'name', 'millimeters'],
  });
  res.status(200).json(insects);
});

// Fetch an insect by id
router.get('/:id', async (req, res, next) => {
  try {
    const insect = await Insect.findByPk(parseInt(req.params.id), {
      attributes: ['id', 'name', 'millimeters'],
      include: {
        model: Tree,
        order: [['heightFt', 'DESC']],
      },
    });
    if (insect) {
      res.json(insect);
    } else {
      next({
        status: 'not-found',
        message: `Could not find tree ${req.params.id}`,
        details: 'Tree not found',
      });
    }
  } catch (err) {
    next({
      status: 'error',
      message: `Could not find tree ${req.params.id}`,
      details: err.errors
        ? err.errors.map((item) => item.message).join(', ')
        : err.message,
    });
  }
});

// Create an insect

router.post('/', async (req, res, next) => {
  const { name, description, fact, territory, millimeters } = req.body;

  try {
    let result = await Insect.build({
      name,
      description,
      fact,
      territory,
      millimeters,
    });
    console.log(result);

    await result.save();
    res.status(201).json({
      status: 'success',
      message: 'Successfully created insect',
      data: result,
    });
  } catch (err) {
    next({
      status: 'error',
      message: err.message || `Could not create an insect`,
      details: err.errors
        ? err.errors.map((item) => item.message).join(', ')
        : err.message,
    });
  }
});

// Delete an insect
router.delete('/:id', async (req, res, next) => {
  try {
    let insect = await Insect.findByPk(req.params.id);
    if (insect) {
      await insect.destroy();
      res.json({
        status: 'success',
        message: `successfully deleted insect ${req.params.id}`,
      });
    }

    res.json({
      status: 404,
      message: 'Could not remove the insect',
      details: 'insect not found',
    });
  } catch (err) {
    next({
      status: 'error',
      message: `Could not remove insect ${req.params.id}`,
      details: err.errors
        ? err.errors.map((item) => item.message).join(', ')
        : err.message,
    });
  }
});

// Update an insect
router.put('/:id', async (req, res, next) => {
  try {
    let insect = await Insect.findByPk(req.params.id);
    let { name, description, fact, territory, millimeters } = req.body;
    console.log(insect);

    if (insect) {
      insect.name = name;
      insect.description = description;
      insect.fact = fact;
      insect.territory = territory;
      insect.millimeters = millimeters;
      await insect.save();
      res.json({
        status: 'success',
        message: 'Succefully updated insect',
        data: insect,
      });
    }

    res.json({
      status: 404,
      message: 'Could not update the insect',
      details: 'insect not found',
    });
  } catch (err) {
    next({
      status: 'error',
      message: `Could not update insect ${req.params.id}`,
      details: err.errors
        ? err.errors.map((item) => item.message).join(', ')
        : err.message,
    });
  }
});

router.get('/search/:value', async (req, res, next) => {
  let trees = [];
  let value = req.params.value;
  console.log(value);

  let insect = await Insect.findAll({
    attributes: ['id', 'name', 'millimeters'],
    where: {
      name: {
        [Op.like]: `%${value}%`,
      },
    },

    include: {
      model: Tree,
      order: [['heightFt', 'DESC']],
    },
  });
  res.json(insect);
});

// Export class - DO NOT MODIFY
module.exports = router;
