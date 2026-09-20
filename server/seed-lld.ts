import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectToDatabase } from './lib/mongodb';
import { LLDProblem } from './models/lldSubmission';

export const INITIAL_LLD_PROBLEMS = [
  {
    title: 'Refactor Invoice Generator for SRP',
    slug: 'srp-invoice-generator',
    description: `## Problem Description
You are given a legacy \`Invoice\` class that handles three distinct responsibilities:
1. **Business Calculations**: Computing subtotal and sales tax.
2. **Presentation**: Printing formatted invoice receipts to stdout.
3. **Data Persistence**: Executing database write operations.

### Requirements
- Refactor the code so that each class has only **one reason to change**.
- Create an \`Invoice\` domain entity holding items and tax rate.
- Create an \`InvoicePrinter\` responsible for rendering receipts.
- Create an \`InvoiceRepository\` responsible for saving invoices to persistence.
- Test your refactored classes with sample invoice items and verify output matches.`,
    difficulty: 'easy' as const,
    patternTags: ['SOLID', 'SRP', 'Refactoring'],
    starterCode: {
      python: `# Refactor this Invoice class to follow the Single Responsibility Principle (SRP)
class Invoice:
    def __init__(self, items, tax_rate=0.08):
        self.items = items
        self.tax_rate = tax_rate

    def calculate_total(self):
        subtotal = sum(item['price'] * item['quantity'] for item in self.items)
        return subtotal + (subtotal * self.tax_rate)

    def print_receipt(self):
        print("====== INVOICE ======")
        for item in self.items:
            print(f"{item['name']}: \${item['price']} x {item['quantity']}")
        print(f"Total: \${self.calculate_total():.2f}")

    def save_to_database(self):
        print(f"Saving invoice with total \${self.calculate_total():.2f} to database")

if __name__ == "__main__":
    items = [
        {"name": "Mechanical Keyboard", "price": 120.0, "quantity": 1},
        {"name": "USB-C Cable", "price": 15.0, "quantity": 2}
    ]
    inv = Invoice(items)
    inv.print_receipt()
    inv.save_to_database()
`,
      java: `// Refactor this Invoice class to satisfy Single Responsibility Principle (SRP)
import java.util.*;

public class Solution {
    static class Item {
        String name;
        double price;
        int quantity;
        Item(String name, double price, int quantity) {
            this.name = name; this.price = price; this.quantity = quantity;
        }
    }

    static class Invoice {
        List<Item> items;
        double taxRate;

        Invoice(List<Item> items, double taxRate) {
            this.items = items;
            this.taxRate = taxRate;
        }

        double calculateTotal() {
            double subtotal = 0;
            for (Item i : items) subtotal += i.price * i.quantity;
            return subtotal + (subtotal * taxRate);
        }

        void printReceipt() {
            System.out.println("====== INVOICE ======");
            for (Item i : items) System.out.println(i.name + ": $" + i.price + " x " + i.quantity);
            System.out.println("Total: $" + calculateTotal());
        }

        void saveToDatabase() {
            System.out.println("Saving invoice to DB: $" + calculateTotal());
        }
    }

    public static void main(String[] args) {
        List<Item> items = Arrays.asList(new Item("Laptop Stand", 45.0, 1), new Item("Mouse Pad", 20.0, 1));
        Invoice inv = new Invoice(items, 0.08);
        inv.printReceipt();
        inv.saveToDatabase();
    }
}
`,
      cpp: `// Refactor Invoice class for Single Responsibility Principle (SRP)
#include <iostream>
#include <vector>
#include <string>

struct Item {
    std::string name;
    double price;
    int quantity;
};

class Invoice {
public:
    std::vector<Item> items;
    double taxRate;

    Invoice(std::vector<Item> items, double taxRate) : items(items), taxRate(taxRate) {}

    double calculateTotal() {
        double subtotal = 0;
        for (const auto& i : items) subtotal += i.price * i.quantity;
        return subtotal + (subtotal * taxRate);
    }
};

int main() {
    std::vector<Item> items = {{"Mechanical Keyboard", 120.0, 1}, {"USB-C Cable", 15.0, 2}};
    Invoice inv(items, 0.08);
    std::cout << "Total: $" << inv.calculateTotal() << std::endl;
    return 0;
}
`,
      javascript: `// Refactor this Invoice class to follow the Single Responsibility Principle (SRP)
class Invoice {
  constructor(items, taxRate = 0.08) {
    this.items = items;
    this.taxRate = taxRate;
  }

  calculateTotal() {
    const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return subtotal + (subtotal * this.taxRate);
  }
}

const items = [
  { name: 'Mechanical Keyboard', price: 120.0, quantity: 1 },
  { name: 'USB-C Cable', price: 15.0, quantity: 2 }
];
const inv = new Invoice(items);
console.log('Total: $' + inv.calculateTotal().toFixed(2));
`
    },
    externalLinks: [
      { label: 'Refactoring Guru - SRP', url: 'https://refactoring.guru/design-patterns' },
      { label: 'Uncle Bob - Clean Architecture', url: 'https://blog.cleancoder.com' }
    ]
  },
  {
    title: 'Open-Closed Principle: Discount Strategy Engine',
    slug: 'ocp-discount-calculator',
    description: `## Problem Description
A retail platform currently uses a switch/if-else block to compute customer discounts:
\`\`\`
if customer_type == "REGULAR": return amount * 0.05
elif customer_type == "VIP": return amount * 0.20
\`\`\`
Every time marketing introduces a new promotion (e.g. Black Friday, Student, Veteran), the core checkout method must be modified.

### Requirements
- Design a polymorphic \`DiscountStrategy\` interface.
- Implement concrete strategies: \`RegularDiscount\`, \`VIPDiscount\`, \`BlackFridayDiscount\`, and \`NoDiscount\`.
- Create an \`OrderProcessor\` that accepts a discount strategy via dependency injection.
- Demonstrate adding a new \`StudentDiscount\` without modifying existing classes.`,
    difficulty: 'medium' as const,
    patternTags: ['SOLID', 'OCP', 'Strategy'],
    starterCode: {
      python: `# Implement an extensible discount strategy engine adhering to OCP
from abc import ABC, abstractmethod

class DiscountStrategy(ABC):
    @abstractmethod
    def calculate(self, amount: float) -> float:
        pass

class RegularDiscount(DiscountStrategy):
    def calculate(self, amount: float) -> float:
        return amount * 0.05

class VIPDiscount(DiscountStrategy):
    def calculate(self, amount: float) -> float:
        return amount * 0.20

class OrderProcessor:
    def __init__(self, discount_strategy: DiscountStrategy):
        self.discount_strategy = discount_strategy

    def get_final_price(self, amount: float) -> float:
        return amount - self.discount_strategy.calculate(amount)

if __name__ == "__main__":
    processor = OrderProcessor(VIPDiscount())
    print(f"Final price for VIP: \${processor.get_final_price(100.0):.2f}")
`,
      java: `// Implement an extensible discount strategy engine adhering to OCP
public class Solution {
    interface DiscountStrategy {
        double calculate(double amount);
    }

    static class RegularDiscount implements DiscountStrategy {
        public double calculate(double amount) { return amount * 0.05; }
    }

    static class VIPDiscount implements DiscountStrategy {
        public double calculate(double amount) { return amount * 0.20; }
    }

    static class OrderProcessor {
        private final DiscountStrategy strategy;
        public OrderProcessor(DiscountStrategy strategy) { this.strategy = strategy; }
        public double getFinalPrice(double amount) {
            return amount - strategy.calculate(amount);
        }
    }

    public static void main(String[] args) {
        OrderProcessor processor = new OrderProcessor(new VIPDiscount());
        System.out.println("Final price for VIP: $" + processor.getFinalPrice(100.0));
    }
}
`,
      cpp: `// Implement an extensible discount strategy engine adhering to OCP
#include <iostream>
#include <memory>

class DiscountStrategy {
public:
    virtual ~DiscountStrategy() = default;
    virtual double calculate(double amount) = 0;
};

class VIPDiscount : public DiscountStrategy {
public:
    double calculate(double amount) override { return amount * 0.20; }
};

int main() {
    auto strategy = std::make_unique<VIPDiscount>();
    std::cout << "Discount: $" << strategy->calculate(100.0) << std::endl;
    return 0;
}
`,
      javascript: `// Implement an extensible discount strategy engine adhering to OCP
class VIPDiscount {
  calculate(amount) { return amount * 0.20; }
}

class OrderProcessor {
  constructor(strategy) { this.strategy = strategy; }
  getFinalPrice(amount) { return amount - this.strategy.calculate(amount); }
}

const processor = new OrderProcessor(new VIPDiscount());
console.log('Final price for VIP: $' + processor.getFinalPrice(100));
`
    },
    externalLinks: [
      { label: 'Refactoring Guru - Strategy Pattern', url: 'https://refactoring.guru/design-patterns/strategy' }
    ]
  },
  {
    title: 'Design a Thread-Safe In-Memory Cache Singleton',
    slug: 'thread-safe-singleton-cache',
    description: `## Problem Description
Design a thread-safe, in-memory Cache Singleton supporting \`get(key)\`, \`put(key, value, ttl_ms)\`, and \`remove(key)\`.

### Requirements
- Guarantee exactly one instance exists across the application lifecycle.
- Prevent reflection or serialization from creating duplicate instances.
- Ensure concurrent reads and writes are synchronized without causing deadlocks.
- Automatically expire keys past their TTL.`,
    difficulty: 'medium' as const,
    patternTags: ['Creational', 'Singleton', 'Concurrency'],
    starterCode: {
      python: `import threading
import time

class ThreadSafeCache:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ThreadSafeCache, cls).__new__(cls)
                cls._instance._store = {}
                cls._instance._cache_lock = threading.Lock()
        return cls._instance

    def put(self, key, value, ttl_seconds=60):
        with self._cache_lock:
            self._store[key] = (value, time.time() + ttl_seconds)

    def get(self, key):
        with self._cache_lock:
            if key not in self._store:
                return None
            val, expiry = self._store[key]
            if time.time() > expiry:
                del self._store[key]
                return None
            return val

if __name__ == "__main__":
    cache1 = ThreadSafeCache()
    cache2 = ThreadSafeCache()
    assert cache1 is cache2, "Singleton instances must be identical!"
    cache1.put("user_1", "Alice", 10)
    print("Retrieved from cache2:", cache2.get("user_1"))
`,
      java: `import java.util.concurrent.*;

public class Solution {
    public static class CacheSingleton {
        private final ConcurrentHashMap<String, Object> store = new ConcurrentHashMap<>();

        private CacheSingleton() {}

        private static class Holder {
            private static final CacheSingleton INSTANCE = new CacheSingleton();
        }

        public static CacheSingleton getInstance() {
            return Holder.INSTANCE;
        }

        public void put(String key, Object val) { store.put(key, val); }
        public Object get(String key) { return store.get(key); }
    }

    public static void main(String[] args) {
        CacheSingleton c1 = CacheSingleton.getInstance();
        CacheSingleton c2 = CacheSingleton.getInstance();
        System.out.println("Same instance? " + (c1 == c2));
        c1.put("token", "xyz-123");
        System.out.println("Retrieved: " + c2.get("token"));
    }
}
`,
      cpp: `#include <iostream>
#include <unordered_map>
#include <mutex>

class CacheSingleton {
private:
    std::unordered_map<std::string, std::string> store;
    std::mutex mtx;
    CacheSingleton() = default;

public:
    static CacheSingleton& getInstance() {
        static CacheSingleton instance;
        return instance;
    }

    void put(const std::string& key, const std::string& val) {
        std::lock_guard<std::mutex> lock(mtx);
        store[key] = val;
    }

    std::string get(const std::string& key) {
        std::lock_guard<std::mutex> lock(mtx);
        return store.count(key) ? store[key] : "";
    }
};

int main() {
    auto& c1 = CacheSingleton::getInstance();
    auto& c2 = CacheSingleton::getInstance();
    c1.put("lang", "C++");
    std::cout << "From c2: " << c2.get("lang") << std::endl;
    return 0;
}
`,
      javascript: `class CacheSingleton {
  constructor() {
    if (CacheSingleton.instance) return CacheSingleton.instance;
    this.store = new Map();
    CacheSingleton.instance = this;
  }

  put(key, val) { this.store.set(key, val); }
  get(key) { return this.store.get(key); }
}

const c1 = new CacheSingleton();
const c2 = new CacheSingleton();
c1.put("name", "TechSim");
console.log("From c2:", c2.get("name"));
`
    },
    externalLinks: [
      { label: 'Refactoring Guru - Singleton', url: 'https://refactoring.guru/design-patterns/singleton' }
    ]
  },
  {
    title: 'Observer Pattern: Real-Time Stock Market Ticker',
    slug: 'stock-ticker-observer',
    description: `## Problem Description
Design a Stock Market Ticker using the **Observer Pattern**.
When a stock's price updates, all subscribed observers (e.g. \`MobileAppDisplay\`, \`HighFrequencyTrader\`, \`AuditLogger\`) must be notified immediately.

### Requirements
- Create a \`StockSubject\` allowing observers to attach and detach.
- Create an \`Observer\` interface with an \`update(symbol, price, timestamp)\` method.
- Implement at least two distinct observers.
- Handle unsubscription properly to prevent memory leaks.`,
    difficulty: 'medium' as const,
    patternTags: ['Behavioral', 'Observer', 'Pub-Sub'],
    starterCode: {
      python: `from abc import ABC, abstractmethod

class StockObserver(ABC):
    @abstractmethod
    def update(self, symbol: str, price: float):
        pass

class StockTicker:
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.price = 0.0
        self._observers = []

    def attach(self, observer: StockObserver):
        self._observers.append(observer)

    def detach(self, observer: StockObserver):
        self._observers.remove(observer)

    def set_price(self, price: float):
        self.price = price
        for obs in self._observers:
            obs.update(self.symbol, self.price)

class MobileDisplay(StockObserver):
    def update(self, symbol: str, price: float):
        print(f"[Mobile Display] {symbol} is now \${price:.2f}")

class AlertSystem(StockObserver):
    def update(self, symbol: str, price: float):
        if price > 200.0:
            print(f"[ALERT] {symbol} crossed \$200: \${price:.2f}!")

if __name__ == "__main__":
    ticker = StockTicker("AAPL")
    mobile = MobileDisplay()
    alert = AlertSystem()
    ticker.attach(mobile)
    ticker.attach(alert)

    ticker.set_price(195.50)
    ticker.set_price(205.00)
`,
      java: `import java.util.*;

public class Solution {
    interface StockObserver {
        void update(String symbol, double price);
    }

    static class StockTicker {
        private final String symbol;
        private double price;
        private final List<StockObserver> observers = new ArrayList<>();

        StockTicker(String symbol) { this.symbol = symbol; }

        public void attach(StockObserver obs) { observers.add(obs); }
        public void setPrice(double price) {
            this.price = price;
            for (StockObserver obs : observers) obs.update(symbol, price);
        }
    }

    public static void main(String[] args) {
        StockTicker ticker = new StockTicker("GOOG");
        ticker.attach((sym, price) -> System.out.println("[Display] " + sym + ": $" + price));
        ticker.setPrice(175.25);
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <string>

class Observer {
public:
    virtual ~Observer() = default;
    virtual void update(const std::string& symbol, double price) = 0;
};

class StockTicker {
    std::string symbol;
    std::vector<Observer*> observers;
public:
    StockTicker(std::string sym) : symbol(sym) {}
    void attach(Observer* o) { observers.push_back(o); }
    void setPrice(double price) {
        for (auto* o : observers) o->update(symbol, price);
    }
};

class Display : public Observer {
public:
    void update(const std::string& sym, double price) override {
        std::cout << "[Display] " << sym << ": $" << price << std::endl;
    }
};

int main() {
    StockTicker ticker("MSFT");
    Display d;
    ticker.attach(&d);
    ticker.setPrice(420.50);
    return 0;
}
`,
      javascript: `class StockTicker {
  constructor(symbol) {
    this.symbol = symbol;
    this.observers = [];
  }
  attach(obs) { this.observers.push(obs); }
  setPrice(price) {
    this.observers.forEach(o => o(this.symbol, price));
  }
}

const ticker = new StockTicker("NVDA");
ticker.attach((sym, price) => console.log(\`[Display] \${sym}: $\${price}\`));
ticker.setPrice(125.0);
`
    },
    externalLinks: [
      { label: 'Refactoring Guru - Observer', url: 'https://refactoring.guru/design-patterns/observer' }
    ]
  },
  {
    title: 'OOD Case Study: Multi-Floor Parking Lot System',
    slug: 'parking-lot-system',
    description: `## Problem Description
Design a low-level object-oriented model for a **Multi-Floor Parking Lot System**.

### Requirements
1. **Spot Types**: Compact, Large (for trucks/buses), and Motorcycle spots.
2. **Vehicle Types**: Motorcycle, Car, and Truck.
3. **Parking Strategy**: Park vehicle in the nearest available spot of matching size.
4. **Ticket & Billing**: Issue a ticket upon entry with timestamp; calculate fee upon exit based on hourly rate.
5. **Concurrency**: Multiple vehicles can enter and exit concurrently across different gates.`,
    difficulty: 'medium' as const,
    patternTags: ['OOD', 'System Design', 'Interview'],
    starterCode: {
      python: `from enum import Enum
import time

class VehicleType(Enum):
    MOTORCYCLE = 1
    CAR = 2
    TRUCK = 3

class ParkingSpotType(Enum):
    MOTORCYCLE = 1
    COMPACT = 2
    LARGE = 3

class Vehicle:
    def __init__(self, license_plate: str, vehicle_type: VehicleType):
        self.license_plate = license_plate
        self.vehicle_type = vehicle_type

class ParkingSpot:
    def __init__(self, spot_id: str, spot_type: ParkingSpotType):
        self.spot_id = spot_id
        self.spot_type = spot_type
        self.is_occupied = False
        self.current_vehicle = None

    def can_fit(self, vehicle: Vehicle) -> bool:
        if self.spot_type == ParkingSpotType.LARGE:
            return True
        if self.spot_type == ParkingSpotType.COMPACT:
            return vehicle.vehicle_type in (VehicleType.CAR, VehicleType.MOTORCYCLE)
        return vehicle.vehicle_type == VehicleType.MOTORCYCLE

class ParkingLot:
    def __init__(self, name: str):
        self.name = name
        self.spots = []

    def add_spot(self, spot: ParkingSpot):
        self.spots.append(spot)

    def park(self, vehicle: Vehicle) -> ParkingSpot:
        for spot in self.spots:
            if not spot.is_occupied and spot.can_fit(vehicle):
                spot.is_occupied = True
                spot.current_vehicle = vehicle
                print(f"Parked {vehicle.license_plate} at {spot.spot_id}")
                return spot
        print(f"No available spot for {vehicle.license_plate}")
        return None

if __name__ == "__main__":
    lot = ParkingLot("Downtown Garage")
    lot.add_spot(ParkingSpot("S1", ParkingSpotType.COMPACT))
    lot.add_spot(ParkingSpot("S2", ParkingSpotType.LARGE))

    car = Vehicle("ABC-123", VehicleType.CAR)
    truck = Vehicle("TRK-999", VehicleType.TRUCK)
    lot.park(car)
    lot.park(truck)
`,
      java: `import java.util.*;

public class Solution {
    enum VehicleType { MOTORCYCLE, CAR, TRUCK }
    enum SpotType { MOTORCYCLE, COMPACT, LARGE }

    static class Vehicle {
        String licensePlate;
        VehicleType type;
        Vehicle(String lp, VehicleType type) { this.licensePlate = lp; this.type = type; }
    }

    static class ParkingSpot {
        String id;
        SpotType type;
        boolean occupied = false;
        ParkingSpot(String id, SpotType type) { this.id = id; this.type = type; }
    }

    static class ParkingLot {
        List<ParkingSpot> spots = new ArrayList<>();
        void addSpot(ParkingSpot s) { spots.add(s); }
    }

    public static void main(String[] args) {
        ParkingLot lot = new ParkingLot();
        lot.addSpot(new ParkingSpot("A1", SpotType.COMPACT));
        System.out.println("Parking Lot initialized with " + lot.spots.size() + " spots.");
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <string>

enum class VehicleType { MOTORCYCLE, CAR, TRUCK };

class Vehicle {
public:
    std::string licensePlate;
    VehicleType type;
    Vehicle(std::string lp, VehicleType t) : licensePlate(lp), type(t) {}
};

int main() {
    Vehicle car("XYZ-789", VehicleType::CAR);
    std::cout << "Vehicle created: " << car.licensePlate << std::endl;
    return 0;
}
`,
      javascript: `class ParkingLot {
  constructor() {
    this.spots = [];
  }
  addSpot(id, type) {
    this.spots.push({ id, type, occupied: false });
  }
}

const lot = new ParkingLot();
lot.addSpot("C1", "COMPACT");
console.log("Parking spots:", lot.spots.length);
`
    },
    externalLinks: [
      { label: 'AlgoMaster LLD - Parking Lot', url: 'https://github.com/ashishps1/awesome-low-level-design' }
    ]
  }
];

async function seedLLDProblems() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    console.log('Upserting standard LLD problems...');
    for (const prob of INITIAL_LLD_PROBLEMS) {
      await LLDProblem.findOneAndUpdate(
        { slug: prob.slug },
        prob,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Successfully seeded ${INITIAL_LLD_PROBLEMS.length} LLD problems!`);
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding LLD problems:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedLLDProblems();
}
