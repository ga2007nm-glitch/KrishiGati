const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const mandiData = [
    ["Yelahanka APMC", "Bengaluru", "Karnataka", "Bengaluru Urban", 13.1007, 77.5963, 100000],
    ["Yeshwanthpur APMC", "Bengaluru", "Karnataka", "Bengaluru Urban", 13.0281, 77.5407, 150000],
    ["Dasarahalli Collection Center", "Bengaluru", "Karnataka", "Bengaluru Urban", 13.0465, 77.5119, 80000],
    ["Azadpur Mandi", "New Delhi", "Delhi", "North Delhi", 28.7041, 77.1025, 300000],
    ["Keshopur Mandi", "New Delhi", "Delhi", "West Delhi", 28.6385, 77.0838, 180000],
    ["Vashi APMC", "Mumbai", "Maharashtra", "Navi Mumbai", 19.0760, 72.8777, 250000],
    ["Pune Market Yard", "Pune", "Maharashtra", "Pune", 18.5018, 73.8636, 220000],
    ["Lasalgaon Onion Market", "Lasalgaon", "Maharashtra", "Nashik", 20.1427, 74.2371, 180000],
    ["Koyambedu Wholesale Market", "Chennai", "Tamil Nadu", "Chennai", 13.0694, 80.1948, 240000],
    ["Oddanchatram Market", "Oddanchatram", "Tamil Nadu", "Dindigul", 10.4880, 77.7550, 120000],
    ["Bowenpally Market", "Hyderabad", "Telangana", "Hyderabad", 17.4650, 78.4690, 230000],
    ["Gaddiannaram Fruit Market", "Hyderabad", "Telangana", "Hyderabad", 17.3698, 78.5380, 170000],
    ["Muzafarpur APMC", "Muzaffarpur", "Bihar", "Muzaffarpur", 26.1209, 85.3647, 140000],
    ["Gulabbagh Mandi", "Purnia", "Bihar", "Purnia", 25.7771, 87.4753, 130000],
    ["Kolkata Koley Market", "Kolkata", "West Bengal", "Kolkata", 22.5726, 88.3639, 220000],
    ["Siliguri Regulated Market", "Siliguri", "West Bengal", "Darjeeling", 26.7271, 88.3953, 130000],
    ["Azadpur Jaipur Mandi", "Jaipur", "Rajasthan", "Jaipur", 26.9124, 75.7873, 190000],
    ["Kota Grain Market", "Kota", "Rajasthan", "Kota", 25.2138, 75.8648, 210000],
    ["Indore Krishi Upaj Mandi", "Indore", "Madhya Pradesh", "Indore", 22.7196, 75.8577, 250000],
    ["Bhopal Karond Mandi", "Bhopal", "Madhya Pradesh", "Bhopal", 23.2599, 77.4126, 160000],
    ["Lucknow Dubagga Mandi", "Lucknow", "Uttar Pradesh", "Lucknow", 26.8467, 80.9462, 220000],
    ["Kanpur Naubasta Mandi", "Kanpur", "Uttar Pradesh", "Kanpur Nagar", 26.4499, 80.3319, 200000],
    ["Gurugram Kherki Daula Mandi", "Gurugram", "Haryana", "Gurugram", 28.4089, 77.0378, 160000],
    ["Karnal Grain Market", "Karnal", "Haryana", "Karnal", 29.6857, 76.9905, 230000],
    ["Amritsar Mandi", "Amritsar", "Punjab", "Amritsar", 31.6340, 74.8723, 210000],
    ["Ludhiana Grain Market", "Ludhiana", "Punjab", "Ludhiana", 30.9000, 75.8573, 240000],
    ["Bhubaneswar Unit 1 Market", "Bhubaneswar", "Odisha", "Khordha", 20.2961, 85.8245, 150000],
    ["Raipur Krishi Mandi", "Raipur", "Chhattisgarh", "Raipur", 21.2514, 81.6296, 180000],
    ["Ranchi Pandra Market", "Ranchi", "Jharkhand", "Ranchi", 23.3441, 85.3096, 140000],
    ["Guwahati Fancy Bazar", "Guwahati", "Assam", "Kamrup Metro", 26.1445, 91.7362, 130000],
    ["Srinagar Parimpora Mandi", "Srinagar", "Jammu and Kashmir", "Srinagar", 34.0837, 74.7973, 100000],
    ["Panaji Market Yard", "Panaji", "Goa", "North Goa", 15.4909, 73.8278, 70000],
    ["Thiruvananthapuram Market", "Thiruvananthapuram", "Kerala", "Thiruvananthapuram", 8.5241, 76.9366, 120000],
    ["Ahmedabad APMC", "Ahmedabad", "Gujarat", "Ahmedabad", 23.0225, 72.5714, 240000],
    ["Rajkot APMC", "Rajkot", "Gujarat", "Rajkot", 22.3039, 70.8022, 180000],
  ].map(([name, city, state, district, latitude, longitude, dailyCapacityKg]) => ({ name, city, state, district, latitude, longitude, dailyCapacityKg }));

async function main() {
  let farmer = await prisma.user.findUnique({ where: { phone: "9999999999" } });
  if (!farmer) {
    farmer = await prisma.user.create({
      data: { phone: "9999999999", name: "Demo Farmer", role: "FARMER" },
    });
  }

  await prisma.$runCommandRaw({
    update: "MandiCenter",
    updates: [{ q: { city: null }, u: { $set: { city: "Bengaluru", state: "Karnataka" } }, multi: true }],
  });

  for (const data of mandiData) {
    const existing = await prisma.mandiCenter.findFirst({ where: { name: data.name } });
    if (existing) {
      await prisma.mandiCenter.update({ where: { id: existing.id }, data });
    } else {
      await prisma.mandiCenter.create({ data });
    }
  }

  console.log(`Seeded farmer ${farmer.phone} and ${mandiData.length} mandis.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
