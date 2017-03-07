var express = require('express');
var router = express.Router();
var pg = require('pg'); 
var path = require('path');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:rhasite@rha-website-0.csse.rose-hulman.edu/rha'
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false});

/*---------------------------- Events Endpoints ------------------------------*/


/* GET active events */
router.get('/api/v1/events', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT proposal_id, proposal_name, event_date, event_signup_close, event_signup_open, cost_to_attendee, image_path, description, attendees FROM proposals WHERE approved = true AND event_date >= CURRENT_DATE ORDER BY event_date ASC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET all events */
router.get('/api/v1/allEvents', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT proposal_id, proposal_name, event_date, quarter_proposed, proposed_date, week_proposed, money_requested, money_allocated, paid FROM proposals ORDER BY proposed_date DESC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET past events */
router.get('/api/v1/pastEvents', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT proposal_id, proposal_name, event_date, event_signup_close, event_signup_open, cost_to_attendee, image_path, description, attendees FROM proposals WHERE approved = true AND event_date < CURRENT_DATE AND event_signup_open IS NOT NULL AND event_signup_close IS NOT NULL AND event_date IS NOT NULL ORDER BY event_date DESC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET single event by id*/
router.get('/api/v1/events/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT proposal_id, proposal_name, event_date, event_signup_close, event_signup_open, cost_to_attendee, image_path, description, attendees FROM proposals WHERE proposal_id = $1;', [id]);
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* PUT modify an event */
router.put('/api/v1/events/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    var firstQuery = createUpdateQuery(id, 'proposal_id', req.body, 'proposals');

    var colValues = [];
    Object.keys(req.body).filter(function (key) {
      colValues.push(req.body[key]);
    });

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM proposals WHERE proposal_id = $1', [id]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/*---------------------------- Member and Event Endpoint ------------------------------*/

/* PUT add a member to a list of attendees */
router.put('/api/v1/events/:event_id/attendees/:member_id', (req, res, next) => {
  const results = [];

  const event_id = req.params.event_id;
  const member_id = req.params.member_id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    var firstQuery = 'UPDATE proposals SET attendees = array_to_json(array(select * from jsonb_array_elements_text(attendees)) || (select username from members where username = $2)::text)::jsonb WHERE proposal_id = $1;'

    client.query(firstQuery, [event_id, member_id]);

    const query = client.query('SELECT * FROM proposals WHERE proposal_id = $1', [event_id]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* DELETE remove a member from a list of attendees */
router.delete('/api/v1/events/:event_id/attendees/:member_id', (req, res, next) => {
  const results = [];

  const event_id = req.params.event_id;
  const member_id = req.params.member_id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    var firstQuery = 'UPDATE proposals SET attendees = array_to_json(array_remove(array(select * from jsonb_array_elements_text(attendees)), $2))::jsonb WHERE proposal_id = $1;'

    client.query(firstQuery, [event_id, member_id]);

    const query = client.query('SELECT * FROM proposals WHERE proposal_id = $1', [event_id]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/*---------------------------- Members Endpoints ------------------------------*/

/* GET all Members */
router.get('/api/v1/members', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT user_id, username, firstname, lastname, hall, image, memberType, cm, phone_number, room_number, active FROM members ORDER BY lastname ASC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

router.put('/api/v1/members/:username', (req, res, next) => {
  const results = [];
  const username = req.params.username;
  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }
    
    var firstQuery = createUpdateQuery('($'+ (Object.keys(req.body).length + 1) + ')', 'username', req.body, 'members'); 

    var colValues = [];
    Object.keys(req.body).filter(function (key) {
      colValues.push(req.body[key]);
    });
    colValues.push(username);

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM members WHERE username = $1', [username]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET all officers (from Members) */
router.get('/api/v1/officers', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT user_id, username, firstname, lastname, hall, image, memberType, cm, phone_number, room_number FROM members WHERE memberType IS NOT NULL ORDER BY lastname ASC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* PUT modify a member */
router.put('/api/v1/member/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    var firstQuery = createUpdateQuery(id, 'user_id', req.body, 'members'); 
    console.log(firstQuery);
    console.log(req.body);
    var colValues = [];
    Object.keys(req.body).filter(function (key) {
      colValues.push(req.body[key]);
    });

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM members WHERE user_id = $1', [id]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* POST new officer (into Members) */
router.post('/api/v1/officer', (req, res, next) => {
  const results= [];

  const data = {username: req.body.username, firstname: req.body.firstname, lastname: req.body.lastname, hall: req.body.hall, image: req.body.image, memberType: req.body.memberType, CM: req.body.CM, phoneNumber: req.body.phoneNumber, roomNumber: req.body.roomNumber};

  if(data.username==null || data.firstname == null || data.lastname == null || data.hall == null || data.image == null || data.CM == null || data.phoneNumber == null || data.roomNumber == null ) {
    return res.status(400).json({success: false, data: "This is not a properly formed officer."});
  }

  pg.connect(connectionString, (err, client, done) => {

    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    client.query('INSERT INTO members(username, firstname, lastname, hall, image, memberType,CM, phone_number, room_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);',
      [data.username, data.firstname, data.lastname, data.hall, data.image, data.memberType, data.CM, data.phoneNumber, data.roomNumber]);

    const query = client.query('SELECT * FROM members WHERE username = $1', [data.username]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET all active members */
router.get('/api/v1/activeMembers', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT user_id, username, firstname, lastname, hall, image, memberType, cm, phone_number, room_number FROM members WHERE active IS TRUE ORDER BY lastname ASC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* DELETE an event */
router.delete('/api/v1/event/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    const query = client.query('DELETE FROM proposals WHERE proposal_id = $1', [id]);

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* DELETE a member */
router.delete('/api/v1/member/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    const query = client.query('DELETE FROM member WHERE user_id = $1', [id]);

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});


/*---------------------------- Committees Endpoints ------------------------------*/


/* GET all committees */
router.get('/api/v1/committees', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT * FROM committee ORDER BY committeeName ASC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* POST a new committee */
router.post('/api/v1/committee', (req, res, next) => {
  const results= [];

  const data = {committeeName: req.body.committeeName, image: req.body.image, description: req.body.description};

  if(data.committeeName==null || data.description == null ) {
    return res.status(400).json({success: false, data: "This is not properly formed committee."});
  }

  pg.connect(connectionString, (err, client, done) => {

    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    client.query('INSERT INTO committee(committeeName, image, description) VALUES ($1, $2, $3);',
      [data.committeeName, data.image, data.description]);
    
    const query = client.query('SELECT * FROM committee WHERE committeeName = $1', [data.committeeName]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* PUT modify a committee */
router.put('/api/v1/committee/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    var firstQuery = createUpdateQuery(id, 'committeeid', req.body, 'committee'); 

    var colValues = [];
    Object.keys(req.body).filter(function (key) {
      colValues.push(req.body[key]);
    });

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM committee WHERE committeeid = $1', [id]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* DELETE a committee */
router.delete('/api/v1/committee/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    const query = client.query('DELETE FROM committee WHERE committeeid = $1', [id]);

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/*---------------------------- Funds Endpoints ------------------------------*/


/* GET all funds */
router.get('/api/v1/funds', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT * FROM funds ORDER BY funds_id ASC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET all funds (floor money) */
router.get('/api/v1/floorMoney', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT * FROM floorMoney ORDER BY floorMoney_id ASC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* PUT modify a fund */
router.put('/api/v1/fund/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    var firstQuery = createUpdateQuery(id, 'funds_id', req.body, 'funds'); 

    var colValues = [];
    Object.keys(req.body).filter(function (key) {
      colValues.push(req.body[key]);
    });

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM funds WHERE funds_id = $1', [id]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* PUT to add to additions (funds table) */
router.put('/api/v1/addition', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }
    var reqJson = req.body;
    console.log(reqJson);

    const query = client.query('SELECT * FROM add_additions($1)', [reqJson.addition]);

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/*---------------------------- Payments / Expenses Endpoints ------------------------------*/
/* GET all payments (expenses) */
router.get('/api/v1/payments', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT * FROM expenses ORDER BY expenses_id ASC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET single payment (expense) by id*/
router.get('/api/v1/payment/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT * FROM expenses WHERE expenses_id = $1;', [id]);
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* POST a new payment (expense) */
router.post('/api/v1/payment', urlencodedParser, function(req, res, next) {
  const results= [];

  pg.connect(connectionString, (err, client, done) => {

    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err, body: req.body});
    }


    var reqJson = req.body;
    var firstQuery = createNewEntryQuery(reqJson, 'expenses');

    var colValues = [];
    Object.keys(reqJson).filter(function (key) {
      colValues.push(reqJson[key]);
    });

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM expenses WHERE proposal_id = $1 and CM = $2 and receiver = $3 and amountUsed = $4 and description = $5 and accountCode = $6', [reqJson.proposal_id, reqJson.CM, reqJson.receiver, reqJson.amountUsed, reqJson.description, reqJson.accountCode] )

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* PUT modify a payment (expense) */
router.put('/api/v1/payment/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    var firstQuery = createUpdateQuery(id, 'expenses_id', req.body, 'expenses'); 

    var colValues = [];
    Object.keys(req.body).filter(function (key) {
      colValues.push(req.body[key]);
    });

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM expenses WHERE expenses_id = $1', [id]) ;

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* DELETE a payment (expense) */
router.delete('/api/v1/payment/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    const query = client.query('DELETE FROM expenses WHERE expenses_id = $1', [id]);

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});


/*---------------------------- Proposals Endpoints ------------------------------*/

/* POST a new proposal */
router.post('/api/v1/proposal', urlencodedParser, function(req, res, next) {
  const results= [];

  console.log(req.body);

  pg.connect(connectionString, (err, client, done) => {

    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err, body: req.body});
    }


    var reqJson = req.body;
    console.log(reqJson);
    var firstQuery = createNewEntryQuery(reqJson, 'proposals');

    var colValues = [];
    Object.keys(reqJson).filter(function (key) {
      colValues.push(reqJson[key]);
    });

    console.log(firstQuery);

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM proposals WHERE proposal_name = $1', [reqJson.proposal_name])

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/*---------------------------- Equipment Endpoints ------------------------------*/

/* GET all equipment data */
router.get('/api/v1/equipment', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT equipmentid, equipmentname, equipmentdescription, rentaltimeindays, equipmentEmbed FROM equipment;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET floor awards value */
router.post('/api/v1/awardsOnly', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM sum_only_awards($1)', [req.body.floorName]);
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET floor expenses value */
router.post('/api/v1/expensesOnly', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM sum_only_expenses($1)', [req.body.floorName]);
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/*---------------------------- Floor Expenses Endpoints ------------------------------*/

/* GET all floor expenses */
router.get('/api/v1/floorExpenses', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console;
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT * FROM floorExpenses ORDER BY floor_expense_id ASC;');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* POST a new floor expense */
router.post('/api/v1/floorExpense', (req, res, next) => {
  const results= [];

  const data = {floor_id: req.body.floor_id, event_description: req.body.event_description, amount: req.body.amount, turned_in_date: req.body.turned_in_date, processed_date: req.body.processed_date};

  if(data.floor_id==null || data.event_description == null || data.amount == null || data.turned_in_date == null || data.processed_date == null) {
    return res.status(400).json({success: false, data: "This is not a properly formed floor expense."});
  }

  pg.connect(connectionString, (err, client, done) => {

    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    client.query('INSERT INTO floorExpenses(floor_id, event_description, amount, turned_in_date, processed_date) VALUES ($1, $2, $3, $4, $5);',
      [data.floor_id, data.event_description, data.amount, data.turned_in_date, data.processed_date]);

    const query = client.query('SELECT * FROM floorExpenses, floorMoney WHERE floorExpenses.event_description = $1 and floorExpenses.amount = $2 and floorExpenses.turned_in_date = $3 and floorExpenses.processed_date = $4 and floorMoney.floorMoney_id = floorExpenses.floor_id', [data.event_description, data.amount, data.turned_in_date, data.processed_date] )

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

// /* POST a new payment (expense) */
// router.post('/api/v1/floorExpense', urlencodedParser, function(req, res, next) {
//   const results= [];

//   pg.connect(connectionString, (err, client, done) => {

//     if(err) {
//       done();
//       console.log(err);
//       return res.status(500).json({success: false, data: err, body: req.body});
//     }


//     var reqJson = req.body;
//     var firstQuery = createNewEntryQuery(reqJson, 'floorExpenses');

//     var colValues = [];
//     Object.keys(reqJson).filter(function (key) {
//       colValues.push(reqJson[key]);
//     });

//     client.query(firstQuery, colValues);

//     const query = client.query('SELECT * FROM floorExpenses, floorMoney WHERE floorExpenses.event_description = $1 and floorExpenses.amount = $2 and floorExpenses.turned_in_date = $3 and floorExpenses.processed_date = $4 and floorMoney.hall_and_floor = $5 and floorMoney.floorMoney_id = floorExpenses.floor_id', [reqJson.event_description, reqJson.amount, reqJson.turned_in_date, reqJson.processed_date, reqJson.hall_and_floor] )

//     query.on('row', (row) => {
//       results.push(row);
//     });

//     query.on('end', () => {
//       done();
//       return res.json(results);
//     });
//   });
// });



/* GET single payment (expense) by id*/
router.get('/api/v1/floorExpense/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT * FROM floorExpenses WHERE floor_expense_id = $1;', [id]);
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* PUT modify a payment (expense) */
router.put('/api/v1/floorExpense/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    var firstQuery = createUpdateQuery(id, 'floor_expense_id', req.body, 'floorExpenses'); 

    var colValues = [];
    Object.keys(req.body).filter(function (key) {
      colValues.push(req.body[key]);
    });

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM floorExpenses WHERE floor_expense_id = $1', [id]) ;

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* DELETE a payment (expense) */
router.delete('/api/v1/floorExpense/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    const query = client.query('DELETE FROM floorExpenses WHERE floor_expense_id = $1', [id]);

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/*------------------------ Function Endpoints---------------------------*/
/* In these API endpoints, they are all labeled as GETs even though they are
   defined as router.post requests. This is because these functions often 
   need arguments, and you need to create POST or PUT requests in order to
   include a body to contain these arguments.
*/

/* GET attendance of floor given a quarter */
router.post('/api/v1/floorAttendance', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM count_attendance_for_floor($1, $2)', [req.body.floorName, req.body.quarter]);
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

/* GET money used for a given proposal_id */
router.post('/api/v1/getMoneyUsed', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM get_money_used($1)', [req.body.proposal_id]);
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});


/* Just calls the update_floor_money() function */
router.get('/api/v1/updateFloorMoney', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM update_floor_money()');
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});


/*---------------------------- Floor Expenses Endpoints ------------------------------*/


/* GET an InfoText */
router.get('/api/v1/infoText/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You did something so bad you broke the server =("});
    }

    const query = client.query('SELECT * FROM infoText WHERE info_text_id = $1;', [id]);
    
    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
}); 

/* PUT modify a payment (expense) */
router.put('/api/v1/infoText/:id', (req, res, next) => {
  const results = [];

  const id = req.params.id;

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: "You broke it so hard it stopped =("});
    }

    var firstQuery = createUpdateQuery(id, 'info_text_id', req.body, 'infoText'); 

    var colValues = [];
    Object.keys(req.body).filter(function (key) {
      colValues.push(req.body[key]);
    });  

    client.query(firstQuery, colValues);

    const query = client.query('SELECT * FROM infoText WHERE info_text_id = $1', [id]) ;
  
    query.on('row', (row) => {  
      results.push(row);  
    });  
  
    query.on('end', () => {  
      done();  
      return res.json(results);  
    });
  });
});

/*---------------------------- Query Help ------------------------------*/

/* Create an UpdateQuery */
function createUpdateQuery (filterVal, filter, cols, table) {
  var query = ['UPDATE ' + table + ' SET'];

  var set = [];
  Object.keys(cols).forEach(function (key, i) {
    set.push(key + ' = ($' + (i + 1) + ')');
  });
  query.push(set.join(', '));

  query.push('Where ' + filter + ' = ' + filterVal);

  return query.join(' ');
}

/* Create an INSERT INTO Query */
function createNewEntryQuery(cols, table) {
  var query = ['INSERT INTO ' + table + "("];

  var toUpdate = [];
  var variables = [];
  Object.keys(cols).forEach(function (key, i) {
    toUpdate.push(key);
    variables.push('($' + (i+1) + ')');
  });

  query.push(toUpdate.join(', ') + ') VALUES (' + variables.join(', ') + ')');
  
  return query.join('');
}
module.exports = router;

