# MongoDB Basics

MongoDB is a document-oriented NoSQL database. Instead of rows in tables, it
stores data as flexible documents in BSON, a binary form of JSON. Documents are
grouped into collections, which are roughly analogous to tables in a relational
database.

Because documents do not require a fixed schema, different documents in the same
collection can have different fields. This flexibility makes MongoDB well suited
to evolving data models.

Indexes in MongoDB improve query performance by letting the database find
matching documents without scanning the whole collection. Every document has a
unique _id field that is indexed by default.

MongoDB Atlas is the managed cloud version of MongoDB. Atlas Vector Search lets
you store embedding vectors alongside documents and run similarity search over
them, which is the foundation of retrieval-augmented generation.
