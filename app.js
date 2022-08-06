//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); //To use static files

//Connecting mongodb using mongoose
mongoose.connect("mongodb+srv://Rushi08:rushi123@cluster0.cd9pn1a.mongodb.net/todolistDB");

// Tasks schema and model
const itemSchema = {
  name: String,
};

const TodoItem = mongoose.model("todoItem", itemSchema);

// Different lists schema and model
const listSchema = {
  name: String,
  items: [itemSchema],
};

const ListCollection = mongoose.model("listCollection", listSchema);

//Making default items
const item1 = new TodoItem({
  name: "Welcome to your todolist",
});
const item2 = new TodoItem({
  name: "Hit the + button add new item",
});
const item3 = new TodoItem({
  name: "<-- Hit this to delete the item",
});

const defaultItems = [item1, item2, item3];

//Adding default items ???????????? Problem: It'll insert items repetitively ????????????
// TodoItem.insertMany(defaultItems, function(err){
//   if(err){
//     console.log(err);
//   }else{
//     console.log("Successfully saved default items");
//   }
// });

app.get("/", function (req, res) {
  // const day = date.getDate();

  //Add default items if there's no item present else find the items and send it to home route
  TodoItem.find({}, function (err, results) {
    if (results.length === 0) {
      // console.log(err);
      TodoItem.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items");
          res.redirect("/");
        }
      });
    } else {
      // console.log(results);
      // res.render(ejsFileName, { listTitle: day, newListItems: results });
      res.render("list", { listTitle: "Today", newListItems: results });
    }
  });
});

app.get("/:customListName", function (req, res) {
  // console.log(req.params.customListName);
  const listName = req.params.customListName.toLowerCase();

  ListCollection.findOne({ name: listName }, function (err, findList) {
    // console.log(err + "\n"+ findList);
    if (!err) {
      if (!findList) {
        const list = new ListCollection({
          name: listName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        // console.log(findList);
        res.render("list", {
          listTitle: findList.name,
          newListItems: findList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // console.log(listName);

  const item = new TodoItem({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    ListCollection.findOne({ name: listName }, function (err, findList) {
      // console.log(findList.items);
      findList.items.push(item);
      findList.save();
      res.redirect("/" + listName);
    });
  }

});

// Post to delete item when checkbox is clicked
app.post("/delete", function (req, res) {
  // console.log(req.body.checkbox);
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    TodoItem.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } 
  else {
    ListCollection.findOneAndUpdate({ name: listName }, {$pull: {items: {_id: checkedItemId}}}, function (err, findList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on " + port + " successfully.");
});
