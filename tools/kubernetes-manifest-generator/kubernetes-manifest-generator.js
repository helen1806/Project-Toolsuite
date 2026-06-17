// Kubernetes Manifest Generator Logic Engine

let stagedManifests = [];
let viewingCombined = false;

document.addEventListener("DOMContentLoaded", () => {
    // Tab switching setup
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const activeTab = btn.getAttribute("data-tab");
            switchTab(activeTab);
        });
    });

    // Dynamic row addition buttons
    document.getElementById("add-env-btn").addEventListener("click", () => addKvRow("env-variables-container", "", ""));
    document.getElementById("add-cm-btn").addEventListener("click", () => addKvRow("cm-data-container", "", ""));
    document.getElementById("add-sec-btn").addEventListener("click", () => addKvRow("sec-data-container", "", ""));

    // Special fields visibility hooks
    document.getElementById("svcType").addEventListener("change", handleServiceTypeChange);
    document.getElementById("secType").addEventListener("change", handleSecretTypeChange);
    document.getElementById("ingTlsEnable").addEventListener("change", toggleIngressTlsPanel);

    // Staging and Merging buttons
    document.getElementById("stage-resource-btn").addEventListener("click", stageCurrentResource);
    document.getElementById("view-combined-btn").addEventListener("click", toggleStagedView);

    // Default dynamic rows initialization
    addKvRow("env-variables-container", "APP_ENV", "production");
    addKvRow("cm-data-container", "DB_HOST", "db.example.com");
    addKvRow("sec-data-container", "API_KEY", "super-secret-token");

    // Add inputs update listeners
    setupFormListeners();

    // Trigger initial render
    generateManifest();
});

function setupFormListeners() {
    const selector = "input[type='text'], input[type='number'], select, textarea, input[type='checkbox']";
    const inputs = document.querySelectorAll(selector);
    
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            if (!viewingCombined) generateManifest();
        });
        input.addEventListener("change", () => {
            if (!viewingCombined) generateManifest();
        });
    });
}

function switchTab(tabName) {
    // Hide all panels
    const panels = document.querySelectorAll(".tab-panel");
    panels.forEach(p => p.classList.remove("active"));

    // Show selected panel
    const activePanel = document.getElementById(`panel-${tabName}`);
    if (activePanel) activePanel.classList.add("active");

    // Update Title
    const titleMap = {
        deployment: "Deployment Settings",
        service: "Service Settings",
        ingress: "Ingress Settings",
        configmap: "ConfigMap Settings",
        secret: "Secret Settings",
        pvc: "PVC Settings"
    };
    document.getElementById("form-card-title").textContent = titleMap[tabName] || "Settings";

    // Reset combined viewing when switching tabs to avoid confusion
    if (viewingCombined) {
        viewingCombined = false;
        const viewCombinedBtn = document.getElementById("view-combined-btn");
        viewCombinedBtn.textContent = `Show Staged (${stagedManifests.length})`;
        document.getElementById("clear-staged-btn").style.display = "none";
        document.getElementById("stage-resource-btn").style.display = "inline-flex";
    }

    // Set default values matching resource type if user hasn't modified name
    const resNameInput = document.getElementById("resName");
    if (resNameInput.value === "my-app" || resNameInput.value.endsWith("-service") || resNameInput.value.endsWith("-ingress") || resNameInput.value.endsWith("-cm") || resNameInput.value.endsWith("-secret") || resNameInput.value.endsWith("-pvc")) {
        if (tabName === "deployment") resNameInput.value = "my-app";
        else if (tabName === "service") resNameInput.value = "my-app-service";
        else if (tabName === "ingress") resNameInput.value = "my-app-ingress";
        else if (tabName === "configmap") resNameInput.value = "my-app-cm";
        else if (tabName === "secret") resNameInput.value = "my-app-secret";
        else if (tabName === "pvc") resNameInput.value = "my-app-pvc";
    }

    generateManifest();
}

function handleServiceTypeChange() {
    const svcType = document.getElementById("svcType").value;
    const nodePortGroup = document.getElementById("svcNodePortGroup");
    const extNameGroup = document.getElementById("svcExternalNameGroup");
    const selectorGroup = document.getElementById("svcSelectorGroup");

    if (svcType === "NodePort") {
        nodePortGroup.style.display = "block";
        extNameGroup.style.display = "none";
        selectorGroup.style.display = "block";
    } else if (svcType === "ExternalName") {
        nodePortGroup.style.display = "none";
        extNameGroup.style.display = "block";
        selectorGroup.style.display = "none";
    } else {
        nodePortGroup.style.display = "none";
        extNameGroup.style.display = "none";
        selectorGroup.style.display = "block";
    }
}

function handleSecretTypeChange() {
    const secType = document.getElementById("secType").value;
    const opaquePanel = document.getElementById("secOpaquePanel");
    const dockerPanel = document.getElementById("secDockerPanel");
    const tlsPanel = document.getElementById("secTlsPanel");

    opaquePanel.style.display = "none";
    dockerPanel.style.display = "none";
    tlsPanel.style.display = "none";

    if (secType === "Opaque") {
        opaquePanel.style.display = "block";
    } else if (secType === "dockerconfigjson") {
        dockerPanel.style.display = "block";
    } else if (secType === "tls") {
        tlsPanel.style.display = "block";
    }
}

function toggleIngressTlsPanel() {
    const tlsChecked = document.getElementById("ingTlsEnable").checked;
    const tlsSubPanel = document.getElementById("ingTlsSubPanel");
    if (tlsChecked) {
        tlsSubPanel.classList.add("active");
    } else {
        tlsSubPanel.classList.remove("active");
    }
}

// Key-Value Rows Builder
function addKvRow(containerId, initialKey = "", initialValue = "") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const row = document.createElement("div");
    row.className = "kv-row";

    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.placeholder = "Key";
    keyInput.value = initialKey;
    keyInput.autocomplete = "off";
    keyInput.spellcheck = false;

    const valInput = document.createElement("input");
    valInput.type = "text";
    valInput.placeholder = "Value";
    valInput.value = initialValue;
    valInput.autocomplete = "off";
    valInput.spellcheck = false;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "X";
    deleteBtn.title = "Delete row";
    deleteBtn.addEventListener("click", () => {
        row.remove();
        if (!viewingCombined) generateManifest();
    });

    // Add update listener to inputs inside row
    [keyInput, valInput].forEach(inp => {
        inp.addEventListener("input", () => {
            if (!viewingCombined) generateManifest();
        });
    });

    row.appendChild(keyInput);
    row.appendChild(valInput);
    row.appendChild(deleteBtn);
    container.appendChild(row);

    if (!viewingCombined) generateManifest();
}

// Helper to safely Base64 encode strings
function safeBtoa(str) {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        return btoa(str);
    }
}

// Parse user label inputs: "key:value, key2:value2"
function parseLabels(labelStr) {
    const labels = {};
    if (!labelStr) return labels;
    
    const parts = labelStr.split(",");
    parts.forEach(part => {
        const colonIndex = part.indexOf(":");
        if (colonIndex !== -1) {
            const key = part.substring(0, colonIndex).trim();
            const val = part.substring(colonIndex + 1).trim();
            if (key) labels[key] = val;
        }
    });
    return labels;
}

// Generate Common Metadata Block
function generateMetadata(kind, name, namespace, labelsObj) {
    let yaml = `apiVersion: ${getApiVersion(kind)}\n`;
    yaml += `kind: ${kind}\n`;
    yaml += `metadata:\n`;
    yaml += `  name: ${name || "unnamed"}\n`;
    if (namespace && namespace !== "default") {
        yaml += `  namespace: ${namespace}\n`;
    }
    
    const labelKeys = Object.keys(labelsObj);
    if (labelKeys.length > 0) {
        yaml += `  labels:\n`;
        labelKeys.forEach(k => {
            yaml += `    ${k}: "${labelsObj[k]}"\n`;
        });
    }
    return yaml;
}

function getApiVersion(kind) {
    switch(kind) {
        case "Deployment":
            return "apps/v1";
        case "Ingress":
            return "networking.k8s.io/v1";
        default:
            return "v1";
    }
}

// main generation router
function generateManifest() {
    if (viewingCombined) return;

    const activeTabBtn = document.querySelector(".tab-btn.active");
    if (!activeTabBtn) return;
    
    const tabName = activeTabBtn.getAttribute("data-tab");
    const resName = document.getElementById("resName").value.trim();
    const resNamespace = document.getElementById("resNamespace").value.trim();
    const resLabels = parseLabels(document.getElementById("resLabels").value.trim());

    let yaml = "";

    switch(tabName) {
        case "deployment":
            yaml = generateDeployment(resName, resNamespace, resLabels);
            break;
        case "service":
            yaml = generateService(resName, resNamespace, resLabels);
            break;
        case "ingress":
            yaml = generateIngress(resName, resNamespace, resLabels);
            break;
        case "configmap":
            yaml = generateConfigMap(resName, resNamespace, resLabels);
            break;
        case "secret":
            yaml = generateSecret(resName, resNamespace, resLabels);
            break;
        case "pvc":
            yaml = generatePVC(resName, resNamespace, resLabels);
            break;
    }

    document.getElementById("previewArea").value = yaml.trim() + "\n";
}

// Generator: Deployment
function generateDeployment(name, namespace, labels) {
    const replicas = document.getElementById("depReplicas").value || "3";
    const port = document.getElementById("depPort").value || "80";
    const image = document.getElementById("depImage").value.trim() || "nginx:alpine";
    
    const cpuReq = document.getElementById("depCpuRequest").value.trim();
    const cpuLim = document.getElementById("depCpuLimit").value.trim();
    const memReq = document.getElementById("depMemRequest").value.trim();
    const memLim = document.getElementById("depMemLimit").value.trim();

    let yaml = generateMetadata("Deployment", name, namespace, labels);
    
    yaml += `spec:\n`;
    yaml += `  replicas: ${replicas}\n`;
    yaml += `  selector:\n`;
    yaml += `    matchLabels:\n`;
    
    // Fallback matchLabel if none exists
    const appLabelKey = Object.keys(labels)[0] || "app";
    const appLabelVal = labels[appLabelKey] || name || "my-app";
    yaml += `      ${appLabelKey}: "${appLabelVal}"\n`;

    yaml += `  template:\n`;
    yaml += `    metadata:\n`;
    yaml += `      labels:\n`;
    // Add all metadata labels to pod template
    if (Object.keys(labels).length > 0) {
        Object.keys(labels).forEach(k => {
            yaml += `        ${k}: "${labels[k]}"\n`;
        });
    } else {
        yaml += `        ${appLabelKey}: "${appLabelVal}"\n`;
    }

    yaml += `    spec:\n`;
    yaml += `      containers:\n`;
    yaml += `        - name: container\n`;
    yaml += `          image: ${image}\n`;
    yaml += `          ports:\n`;
    yaml += `            - containerPort: ${port}\n`;

    // env vars
    const envRows = document.getElementById("env-variables-container").querySelectorAll(".kv-row");
    let envYaml = "";
    envRows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        const key = inputs[0].value.trim();
        const val = inputs[1].value.trim();
        if (key) {
            envYaml += `            - name: ${key}\n`;
            envYaml += `              value: "${val}"\n`;
        }
    });

    if (envYaml) {
        yaml += `          env:\n` + envYaml;
    }

    // resources
    if (cpuReq || cpuLim || memReq || memLim) {
        yaml += `          resources:\n`;
        if (cpuReq || memReq) {
            yaml += `            requests:\n`;
            if (cpuReq) yaml += `              cpu: "${cpuReq}"\n`;
            if (memReq) yaml += `              memory: "${memReq}"\n`;
        }
        if (cpuLim || memLim) {
            yaml += `            limits:\n`;
            if (cpuLim) yaml += `              cpu: "${cpuLim}"\n`;
            if (memLim) yaml += `              memory: "${memLim}"\n`;
        }
    }

    return yaml;
}

// Generator: Service
function generateService(name, namespace, labels) {
    const svcType = document.getElementById("svcType").value;
    const port = document.getElementById("svcPort").value || "80";
    const targetPort = document.getElementById("svcTargetPort").value.trim() || "80";
    const nodePort = document.getElementById("svcNodePort").value;
    const externalName = document.getElementById("svcExternalName").value.trim();
    const selectorStr = document.getElementById("svcSelector").value.trim();
    const selectorsObj = parseLabels(selectorStr);

    let yaml = generateMetadata("Service", name, namespace, labels);
    
    yaml += `spec:\n`;
    yaml += `  type: ${svcType}\n`;

    if (svcType === "ExternalName") {
        yaml += `  externalName: ${externalName || "database.example.com"}\n`;
        return yaml;
    }

    // Ports
    yaml += `  ports:\n`;
    yaml += `    - port: ${port}\n`;
    if (!isNaN(targetPort)) {
        yaml += `      targetPort: ${targetPort}\n`;
    } else {
        yaml += `      targetPort: "${targetPort}"\n`;
    }
    
    if (svcType === "NodePort" && nodePort) {
        yaml += `      nodePort: ${nodePort}\n`;
    }

    // Selector
    const selectorKeys = Object.keys(selectorsObj);
    if (selectorKeys.length > 0) {
        yaml += `  selector:\n`;
        selectorKeys.forEach(k => {
            yaml += `    ${k}: "${selectorsObj[k]}"\n`;
        });
    }

    return yaml;
}

// Generator: Ingress
function generateIngress(name, namespace, labels) {
    const ingClass = document.getElementById("ingClass").value.trim();
    const host = document.getElementById("ingHost").value.trim();
    const path = document.getElementById("ingPath").value.trim() || "/";
    const svcName = document.getElementById("ingSvcName").value.trim() || "my-service";
    const svcPort = document.getElementById("ingSvcPort").value || "80";
    const tlsEnable = document.getElementById("ingTlsEnable").checked;
    const tlsSecret = document.getElementById("ingTlsSecret").value.trim();

    let yaml = generateMetadata("Ingress", name, namespace, labels);

    yaml += `spec:\n`;
    if (ingClass) {
        yaml += `  ingressClassName: ${ingClass}\n`;
    }

    if (tlsEnable && host) {
        yaml += `  tls:\n`;
        yaml += `    - hosts:\n`;
        yaml += `        - ${host}\n`;
        if (tlsSecret) {
            yaml += `      secretName: ${tlsSecret}\n`;
        }
    }

    yaml += `  rules:\n`;
    yaml += `    - host: ${host || "example.com"}\n`;
    yaml += `      http:\n`;
    yaml += `        paths:\n`;
    yaml += `          - path: ${path}\n`;
    yaml += `            pathType: Prefix\n`;
    yaml += `            backend:\n`;
    yaml += `              service:\n`;
    yaml += `                name: ${svcName}\n`;
    yaml += `                port:\n`;
    yaml += `                  number: ${svcPort}\n`;

    return yaml;
}

// Generator: ConfigMap
function generateConfigMap(name, namespace, labels) {
    let yaml = generateMetadata("ConfigMap", name, namespace, labels);
    
    const rows = document.getElementById("cm-data-container").querySelectorAll(".kv-row");
    let hasData = false;
    let dataYaml = `data:\n`;

    rows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        const key = inputs[0].value.trim();
        const val = inputs[1].value.trim();
        if (key) {
            hasData = true;
            dataYaml += `  ${key}: |-\n    ${val.replace(/\n/g, "\n    ")}\n`;
        }
    });

    if (hasData) {
        yaml += dataYaml;
    } else {
        yaml += `data: {}\n`;
    }

    return yaml;
}

// Generator: Secret
function generateSecret(name, namespace, labels) {
    const secType = document.getElementById("secType").value;
    let yaml = generateMetadata("Secret", name, namespace, labels);

    if (secType === "Opaque") {
        const base64Encode = document.getElementById("secBase64Encode").checked;
        const rows = document.getElementById("sec-data-container").querySelectorAll(".kv-row");
        
        let hasData = false;
        let dataYaml = base64Encode ? `data:\n` : `stringData:\n`;

        rows.forEach(row => {
            const inputs = row.querySelectorAll("input");
            const key = inputs[0].value.trim();
            const val = inputs[1].value.trim();
            if (key) {
                hasData = true;
                const formattedVal = base64Encode ? safeBtoa(val) : val;
                dataYaml += `  ${key}: "${formattedVal}"\n`;
            }
        });

        if (hasData) {
            yaml += dataYaml;
        } else {
            yaml += `data: {}\n`;
        }
    } else if (secType === "dockerconfigjson") {
        yaml += `type: kubernetes.io/dockerconfigjson\n`;
        yaml += `data:\n`;
        
        const server = document.getElementById("secDockerServer").value.trim() || "https://index.docker.io/v1/";
        const username = document.getElementById("secDockerUsername").value.trim();
        const password = document.getElementById("secDockerPassword").value.trim();
        const email = document.getElementById("secDockerEmail").value.trim() || "user@example.com";

        const authStr = safeBtoa(`${username}:${password}`);
        const configJson = {
            auths: {}
        };
        configJson.auths[server] = {
            username: username,
            password: password,
            email: email,
            auth: authStr
        };

        const configB64 = safeBtoa(JSON.stringify(configJson));
        yaml += `  .dockerconfigjson: "${configB64}"\n`;
    } else if (secType === "tls") {
        yaml += `type: kubernetes.io/tls\n`;
        yaml += `data:\n`;
        
        const certStr = document.getElementById("secTlsCert").value.trim();
        const keyStr = document.getElementById("secTlsKey").value.trim();

        const certB64 = certStr ? safeBtoa(certStr) : "";
        const keyB64 = keyStr ? safeBtoa(keyStr) : "";

        yaml += `  tls.crt: "${certB64 || "BASE64_CERTIFICATE_HERE"}"\n`;
        yaml += `  tls.key: "${keyB64 || "BASE64_KEY_HERE"}"\n`;
    }

    return yaml;
}

// Generator: PVC
function generatePVC(name, namespace, labels) {
    const storageClass = document.getElementById("pvcStorageClass").value.trim();
    const storageSize = document.getElementById("pvcStorageSize").value.trim() || "10Gi";
    const pvcRWO = document.getElementById("pvcRWO").checked;
    const pvcROX = document.getElementById("pvcROX").checked;
    const pvcRWX = document.getElementById("pvcRWX").checked;

    let yaml = generateMetadata("PersistentVolumeClaim", name, namespace, labels);
    
    yaml += `spec:\n`;
    if (storageClass) {
        yaml += `  storageClassName: ${storageClass}\n`;
    }
    
    yaml += `  accessModes:\n`;
    let modesCount = 0;
    if (pvcRWO) {
        yaml += `    - ReadWriteOnce\n`;
        modesCount++;
    }
    if (pvcROX) {
        yaml += `    - ReadOnlyMany\n`;
        modesCount++;
    }
    if (pvcRWX) {
        yaml += `    - ReadWriteMany\n`;
        modesCount++;
    }

    // Default to RWO if nothing is selected
    if (modesCount === 0) {
        yaml += `    - ReadWriteOnce\n`;
    }

    yaml += `  resources:\n`;
    yaml += `    requests:\n`;
    yaml += `      storage: ${storageSize}\n`;

    return yaml;
}

// Staging & Multi-resource YAML helpers
function stageCurrentResource() {
    const activeTabBtn = document.querySelector(".tab-btn.active");
    if (!activeTabBtn) return;
    
    const type = activeTabBtn.getAttribute("data-tab");
    const name = document.getElementById("resName").value.trim() || "unnamed";
    
    // Generate fresh YAML
    generateManifest();
    const yaml = document.getElementById("previewArea").value;

    // Check if duplicate staged (same type and name)
    const existingIndex = stagedManifests.findIndex(m => m.type === type && m.name === name);
    if (existingIndex !== -1) {
        stagedManifests[existingIndex].yaml = yaml;
        showNotification("info", `Updated staged manifest for ${type}/${name}`);
    } else {
        stagedManifests.push({ type, name, yaml });
        showNotification("success", `Staged manifest for ${type}/${name}`);
    }

    updateStagedUI();
}

function updateStagedUI() {
    const count = stagedManifests.length;
    const viewBtn = document.getElementById("view-combined-btn");
    
    if (viewingCombined) {
        viewBtn.textContent = `Show Active Resource`;
    } else {
        viewBtn.textContent = `Show Staged (${count})`;
    }
}

function toggleStagedView() {
    viewingCombined = !viewingCombined;
    const viewBtn = document.getElementById("view-combined-btn");
    const clearBtn = document.getElementById("clear-staged-btn");
    const stageBtn = document.getElementById("stage-resource-btn");

    if (viewingCombined) {
        viewBtn.textContent = "Show Active Resource";
        clearBtn.style.display = "inline-flex";
        stageBtn.style.display = "none";
        
        // Assemble and display combined YAML
        if (stagedManifests.length === 0) {
            document.getElementById("previewArea").value = "# No manifests staged yet.\n# Click 'Stage YAML' on the left configurations to add items here.";
        } else {
            const combined = stagedManifests.map(m => m.yaml.trim()).join("\n---\n");
            document.getElementById("previewArea").value = combined + "\n";
        }
    } else {
        viewBtn.textContent = `Show Staged (${stagedManifests.length})`;
        clearBtn.style.display = "none";
        stageBtn.style.display = "inline-flex";
        
        generateManifest();
    }
}

function clearStaged() {
    stagedManifests = [];
    viewingCombined = false;
    
    const viewBtn = document.getElementById("view-combined-btn");
    const clearBtn = document.getElementById("clear-staged-btn");
    const stageBtn = document.getElementById("stage-resource-btn");

    viewBtn.textContent = "Show Staged (0)";
    clearBtn.style.display = "none";
    stageBtn.style.display = "inline-flex";
    
    showNotification("info", "Cleared staged manifests list");
    generateManifest();
}

// Clipboard Action
function copyYAML() {
    const textarea = document.getElementById("previewArea");
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
        showNotification("success", "Kubernetes YAML copied to clipboard!");
    }).catch(err => {
        alert("Copied!");
    });
}

// Download File Action
function downloadYAML() {
    const content = document.getElementById("previewArea").value;
    const blob = new Blob([content], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    
    // Choose filename based on view
    let filename = "k8s-manifest.yaml";
    if (!viewingCombined) {
        const activeTabBtn = document.querySelector(".tab-btn.active");
        if (activeTabBtn) {
            const type = activeTabBtn.getAttribute("data-tab");
            const name = document.getElementById("resName").value.trim() || "k8s";
            filename = `${name}-${type}.yaml`;
        }
    }
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("success", `Downloaded ${filename} successfully`);
}

function showNotification(type, message) {
    if (typeof notify !== 'undefined') {
        if (type === "success") notify.success(message);
        else if (type === "info") notify.info(message);
        else notify.error(message);
    } else {
        console.log(`[Notification - ${type}]: ${message}`);
    }
}
