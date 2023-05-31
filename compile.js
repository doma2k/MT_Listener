const protobuf = require("protobufjs");
const fs = require("fs");
const path = require("path");

const rootDir = "./proto"; // Path to the root folder containing your proto files
const outputDir = "./generated"; // Output directory for the generated JavaScript code

// Load all proto files in the specified folder and its subfolders
const root = protobuf.loadSync({
    root: rootDir,
    fileNames: ["**/*.proto"],
    includeDirs: [rootDir],
});

// Specify the output options for the code generation
const outputOptions = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

// Generate JavaScript code for all loaded proto files
const generatedCode = root.toDescriptor("proto3").toJSON(outputOptions);

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Generate JavaScript files for the proto files
for (const file of generatedCode.file) {
    const filePath = path.join(outputDir, file.name.replace(".proto", ".js"));
    const code = protobuf.util.codegen(file, outputOptions);
    fs.writeFileSync(filePath, code);
}

console.log("Proto files compiled and JavaScript code generated successfully.");
