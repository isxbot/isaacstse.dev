---
title: System Design Interview Vol. 1
author: Alex Xu
publisher: ByteByteGo
year: 2020
covers: ch. 1
updated: 2026-10-02
draft: false
---

## Ch. 1 Scaling from Zero to Millions of Users
### Summary:
- Redundancy at every tier
- Stateless web tier
- Caching
- Serve static content via CDN
- Scale the data tier with sharding
- Support multiple data centers
- Tiers should be divided into individual services
- Observability and automation

### Relational vs Non-relational databases
- Relational databases represent data as tables and rows, which supports joins.
- Non-relational databases (i.e., NoSQL) have four categories:
  - Key/Value
  - Graph
  - Column
  - Document
- Most of the time, relational databases are fine unless you have a use case that that requries:
  - Very low latency
  - A massive amount of data
  - The data is unstructured or non-relational
  - You only care about serializing or deserializing data (JSON, XML, YAML, etc.)

### Verical vs Horizonal Scaling
- Vertical scaling is fine if you have low traffic (simplicity being the main advantage), but it has flaws:
  - There's a limit to how much you can vertically scale an instance
  - No failover/redundancy and single point of failure
- Horizontal scaling is typically more desirable for large scale applications because of these drawbacks

### Load Balancing
- Allows for transparent horizontal scaling 
- Improves reliability

### Database Replication
- Improve failover and redundancy in the data tier
- Approaches:
  - Leader/Following (simplest)
  - Multi-leader
  - Leaderless
- Advantages of replication:
  - Performance: allows more queries to be performed in parallel
  - Reliability: if a follower dies, a request is simply sent to another or to the leader; followers can be promoted to become leader
  - High availability: replicating data to different locations allows for continuous operation

### Improving Load/Response Time: Caching and CDNs
- A "fall through" cache is one such that a server first checks the cache for data, then falls through to the database in the event of a cache miss
- Cache considerations:
  - Cache data that's read often but modified infrequently
  - Set an expiration policy that balances data becoming stale and unnecessarily performing database queries
  - Inconsistency between the cache and data store can be a challenge when scaling across multiple regions
  - Avoid creating a single point of failure with a single cache
  - Eviction policies: LRU, LFU, FIFO, etc.
- CDN considerations:
  - Cost (usually third-party providers)
  - Cache expiration cnosideration same as above
  - SPOF: how will the application cope during a CDN outage?
  - Invalidating files: via API or object versioning

### Stateless Web Tier
- Move state to a relational database, Memcached/Redis, NoSQL, etc.
- Simplicity (no sticky sessions, etc.)
- Auto-scaling
- More robust

