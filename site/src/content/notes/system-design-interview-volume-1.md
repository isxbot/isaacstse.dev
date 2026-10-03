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

### Summary
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
- Most of the time, relational databases are fine unless you have a use case that requries:
  - Very low latency
  - A massive amount of data
  - The data is unstructured or non-relational
  - You only care about serializing or deserializing data (JSON, XML, YAML, etc.)

### Vertical vs Horizontal Scaling
- Vertical scaling is fine if you have low traffic (simplicity being the main advantage), but it has flaws:
  - There's a limit to how much you can vertically scale an instance.
  - No failover/redundancy and single point of failure.
- Horizontal scaling is typically more desirable for large scale applications because of these drawbacks.

### Load Balancing
- Allows for transparent horizontal scaling.
- Improves reliability.

### Database Replication
- Improve failover and redundancy in the data tier.
- Approaches:
  - Leader/Follower (simplest)
  - Multi-leader
  - Leaderless
- Advantages of replication:
  - Performance: allows more queries to be performed in parallel.
  - Reliability: if a follower dies, a request is simply sent to another or to the leader; followers can be promoted to become leader.
  - High availability: replicating data to different locations allows for continuous operation.

### Improving Load/Response Time: Caching and CDNs
- A "fall through" cache is one such that a server first checks the cache for data, then falls through to the database in the event of a cache miss.
- Cache considerations:
  - Cache data that's read often but modified infrequently.
  - Set an expiration policy that balances data becoming stale and unnecessarily performing database queries.
  - Inconsistency between the cache and data store can be a challenge when scaling across multiple regions.
  - Avoid creating a single point of failure with a single cache.
  - Eviction policies: LRU, LFU, FIFO, etc.
- CDN considerations:
  - Cost (usually third-party providers).
  - Cache expiration consideration same as above.
  - SPOF: how will the application cope during a CDN outage?
  - Invalidating files: via API or object versioning.

### Stateless Web Tier
- Move state to a relational database, Memcached/Redis, NoSQL, etc.
- Simplicity (no sticky sessions, etc.)
- Auto-scaling
- Robust

### Data Centers
- Supporting multiple data centers involves geographical DNS routing (geoDNS, geo-routing) to send traffic to the nearest data center.
- Challenges:
  - Traffic redirection
  - Data synchronization: a common strategy is to replicate data across multiple data centers
  - Test/deployment: tests should be run from various locations.

### Message Queues
- Serve as buffers and distribute async requests.
- Decouples producers and consumers.
- Producers and consumers can scale independently.
- Preferred architecture for scalability and reliability.

### Database scaling
- Two broad approaches: vertical and horizontal.
- Vertically scaling databases suffers from the same issues mentioned before: hardware limitations, SPOF risks, overall cost.
- Sharding allows databases to be scaled horizontally.
- Each shard has the same schema, but the data on each is unqiue to the shard.
- The most important consideration is the partition key (sharding key). It should allow for even distribution of data.
- Challenges:
  - Resharding data is required when a shard becomes exhausted. This requires updating the sharding function and moving data around. Consistent hashing can be used to mitigate this problem.
  - Celebrity problem (aka hotspot key problem). One shard may receive a disproportionate amount of requests such that an entire shard may need to be allocated to a specific key.
  - Joins and de-normalization. It's difficult to perform joins on sharded data across databases. A common workaround is to de-normalize the database so requests can be performed against a single shard.

## Ch. 2 Back-of-Envelope Calculations
### Powers of Two
| Power |  ~Value  | Unit |
|---|---|---|
|2^10 | 1 Thousand    | 1 KB |
|2^20 | 1 Million     | 1 MB |
|2^30 | 1 Billion     | 1 GB |
|2^40 | 1 Trillion    | 1 TB |
|2^50 | 1 Quadrillion | 1 PT |

### [Latency Numbers](https://gist.github.com/hellerbarde/2843375)
```
L1 cache reference ......................... 0.5 ns
Branch mispredict ............................ 5 ns
L2 cache reference ........................... 7 ns
Mutex lock/unlock ........................... 25 ns
Main memory reference ...................... 100 ns             
Compress 1K bytes with Zippy ............. 3,000 ns  =   3 µs
Send 2K bytes over 1 Gbps network ....... 20,000 ns  =  20 µs
SSD random read ........................ 150,000 ns  = 150 µs
Read 1 MB sequentially from memory ..... 250,000 ns  = 250 µs
Round trip within same datacenter ...... 500,000 ns  = 0.5 ms
Read 1 MB sequentially from SSD* ..... 1,000,000 ns  =   1 ms
Disk seek ........................... 10,000,000 ns  =  10 ms
Read 1 MB sequentially from disk .... 20,000,000 ns  =  20 ms
Send packet CA->Netherlands->CA .... 150,000,000 ns  = 150 ms
```

### Availability Metrics
```
Uptime (downtime)                     Daily       Weekly      Monthly          Yearly
98.0% uptime (2.0% down) ........   28m 48s   3h 21m 36s   14h 24m 0s    7d 7h 12m 0s
99.0% uptime (1.0% down) ........   14m 24s   1h 40m 48s    7h 12m 0s   3d 15h 36m 0s
99.5% uptime (0.5% down) ........    7m 12s      50m 24s    3h 36m 0s   1d 19h 48m 0s
99.7% uptime (0.3% down) ........    4m 19s      30m 14s    2h 9m 36s   1d 2h 16m 48s
99.9% uptime (0.1% down) ........    1m 26s       10m 4s      43m 12s      8h 45m 36s
99.95% uptime (0.05% down) ......       43s        5m 2s      21m 36s      4h 22m 48s
99.99% uptime (0.01% down) ......      8.6s        1m 0s       4m 19s         52m 34s
99.999% uptime (0.001% down) ....     864ms           6s          26s          5m 15s
```
