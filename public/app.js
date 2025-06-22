class SenSanteApp {
  constructor() {
    this.token = localStorage.getItem("token")
    this.user = JSON.parse(localStorage.getItem("user") || "null")
    this.init()
  }

  init() {
    this.setupEvents()
    if (this.token && this.user) {
      this.showMainPage()
    } else {
      this.showLoginPage()
    }
  }

  setupEvents() {
    // Login
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.login()
    })

    // Logout
    document.getElementById("logout-btn").addEventListener("click", () => this.logout())

    // Navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        const section = item.dataset.section
        this.showSection(section)
      })
    })

    // Modals
    document.getElementById("new-patient-btn").addEventListener("click", () => this.showModal("patient-modal"))
    document
      .getElementById("new-consultation-btn")
      .addEventListener("click", () => this.showModal("consultation-modal"))

    // Close modals
    document.querySelectorAll(".close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.hideModal(e.target.closest(".modal").id)
      })
    })

    // Forms
    document.getElementById("patient-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.createPatient()
    })

    document.getElementById("consultation-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.createConsultation()
    })
  }

  async login() {
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        this.token = data.token
        this.user = data.user
        localStorage.setItem("token", this.token)
        localStorage.setItem("user", JSON.stringify(this.user))
        this.showMainPage()
        this.showMessage("Connexion réussie !", "success")
      } else {
        this.showError(data.error)
      }
    } catch (error) {
      this.showError("Erreur de connexion")
    }
  }

  logout() {
    this.token = null
    this.user = null
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    this.showLoginPage()
    this.showMessage("Déconnexion réussie", "success")
  }

  showLoginPage() {
    document.getElementById("login-page").classList.add("active")
    document.getElementById("main-page").classList.remove("active")
  }

  showMainPage() {
    document.getElementById("login-page").classList.remove("active")
    document.getElementById("main-page").classList.add("active")

    // User info
    const userInfo =
      this.user.type === "admin"
        ? `Admin ${this.user.prenom} ${this.user.nom}`
        : `Dr. ${this.user.prenom} ${this.user.nom}`
    document.getElementById("user-info").textContent = userInfo

    // Show audit for admin
    if (this.user.type === "admin") {
      document.getElementById("audit-nav").style.display = "block"
    }

    this.showSection("dashboard")
  }

  showSection(section) {
    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"))
    document.querySelector(`[data-section="${section}"]`).classList.add("active")

    // Show section
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"))
    document.getElementById(section).classList.add("active")

    // Load data
    switch (section) {
      case "dashboard":
        this.loadDashboard()
        break
      case "patients":
        this.loadPatients()
        break
      case "consultations":
        this.loadConsultations()
        break
      case "audit":
        this.loadAudit()
        break
    }
  }

  async loadDashboard() {
    try {
      const response = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      const data = await response.json()

      const container = document.getElementById("stats-container")

      if (this.user.type === "admin") {
        container.innerHTML = `
          <div class="stat-card">
            <h3>Total Patients</h3>
            <div class="stat-number">${data.patients}</div>
            <div class="stat-description">Patients enregistrés</div>
          </div>
          <div class="stat-card">
            <h3>Médecins</h3>
            <div class="stat-number">${data.medecins}</div>
            <div class="stat-description">Médecins actifs</div>
          </div>
          <div class="stat-card">
            <h3>Consultations</h3>
            <div class="stat-number">${data.consultations}</div>
            <div class="stat-description">Total consultations</div>
          </div>
          <div class="stat-card">
            <h3>Sites</h3>
            <div class="stat-number">${data.sites}</div>
            <div class="stat-description">Sites médicaux</div>
          </div>
        `
      } else {
        container.innerHTML = `
          <div class="stat-card">
            <h3>Patients du Site</h3>
            <div class="stat-number">${data.patients}</div>
            <div class="stat-description">Patients de votre site</div>
          </div>
          <div class="stat-card">
            <h3>Mes Consultations</h3>
            <div class="stat-number">${data.consultations}</div>
            <div class="stat-description">Consultations effectuées</div>
          </div>
        `
      }
    } catch (error) {
      this.showError("Erreur lors du chargement du dashboard")
    }
  }

  async loadPatients() {
    try {
      const response = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      const patients = await response.json()

      const container = document.getElementById("patients-list")
      container.innerHTML = patients
        .map(
          (patient) => `
        <div class="card">
          <h4>${patient.prenom} ${patient.nom}</h4>
          <p><strong>Âge:</strong> ${patient.age} ans</p>
          <p><strong>Téléphone:</strong> ${patient.telephone || "Non renseigné"}</p>
          <p><strong>Adresse:</strong> ${patient.adresse || "Non renseignée"}</p>
          ${this.user.type === "admin" ? `<p><strong>Site:</strong> ${patient.site_nom}</p>` : ""}
          <p><strong>Antécédents:</strong> ${patient.antecedents || "Aucun"}</p>
        </div>
      `,
        )
        .join("")
    } catch (error) {
      this.showError("Erreur lors du chargement des patients")
    }
  }

  async loadConsultations() {
    try {
      const response = await fetch("/api/consultations", {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      const consultations = await response.json()

      const container = document.getElementById("consultations-list")
      container.innerHTML = consultations
        .map(
          (consultation) => `
        <div class="card">
          <h4>${consultation.patient_prenom} ${consultation.patient_nom}</h4>
          <p><strong>Médecin:</strong> Dr. ${consultation.medecin_prenom} ${consultation.medecin_nom}</p>
          ${this.user.type === "admin" ? `<p><strong>Site:</strong> ${consultation.site_nom}</p>` : ""}
          <p><strong>Diagnostic:</strong> ${consultation.diagnostic}</p>
          <p><strong>Notes:</strong> ${consultation.notes || "Aucune note"}</p>
          <p><strong>Traitement:</strong> ${consultation.traitement || "Aucun traitement"}</p>
          <p class="date">${new Date(consultation.date_consultation).toLocaleString("fr-FR")}</p>
        </div>
      `,
        )
        .join("")
    } catch (error) {
      this.showError("Erreur lors du chargement des consultations")
    }
  }

  async loadAudit() {
    if (this.user.type !== "admin") return

    try {
      const response = await fetch("/api/audit", {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      const logs = await response.json()

      const container = document.getElementById("audit-table")
      container.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Date/Heure</th>
              <th>Action</th>
              <th>Utilisateur</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${logs
              .map(
                (log) => `
              <tr>
                <td>${new Date(log.date_action).toLocaleString("fr-FR")}</td>
                <td>${log.action}</td>
                <td>${log.utilisateur_nom || "Système"}</td>
                <td>${log.utilisateur_type}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    } catch (error) {
      this.showError("Erreur lors du chargement de l'audit")
    }
  }

  async createPatient() {
    const formData = {
      nom: document.getElementById("patient-nom").value,
      prenom: document.getElementById("patient-prenom").value,
      age: Number.parseInt(document.getElementById("patient-age").value),
      telephone: document.getElementById("patient-telephone").value,
      adresse: document.getElementById("patient-adresse").value,
      antecedents: document.getElementById("patient-antecedents").value,
    }

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        this.hideModal("patient-modal")
        this.loadPatients()
        this.loadDashboard()
        this.showMessage("Patient créé avec succès !", "success")
        document.getElementById("patient-form").reset()
      } else {
        this.showError("Erreur lors de la création du patient")
      }
    } catch (error) {
      this.showError("Erreur lors de la création du patient")
    }
  }

  async createConsultation() {
    const formData = {
      patient_id: Number.parseInt(document.getElementById("consultation-patient").value),
      diagnostic: document.getElementById("consultation-diagnostic").value,
      notes: document.getElementById("consultation-notes").value,
      traitement: document.getElementById("consultation-traitement").value,
    }

    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        this.hideModal("consultation-modal")
        this.loadConsultations()
        this.loadDashboard()
        this.showMessage("Consultation enregistrée avec succès !", "success")
        document.getElementById("consultation-form").reset()
      } else {
        this.showError("Erreur lors de l'enregistrement de la consultation")
      }
    } catch (error) {
      this.showError("Erreur lors de l'enregistrement de la consultation")
    }
  }

  async showModal(modalId) {
    document.getElementById(modalId).classList.add("show")

    if (modalId === "consultation-modal") {
      await this.loadPatientsSelect()
    }
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.remove("show")
  }

  async loadPatientsSelect() {
    try {
      const response = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      const patients = await response.json()

      const select = document.getElementById("consultation-patient")
      select.innerHTML =
        '<option value="">Sélectionner un patient</option>' +
        patients.map((patient) => `<option value="${patient.id}">${patient.prenom} ${patient.nom}</option>`).join("")
    } catch (error) {
      this.showError("Erreur lors du chargement des patients")
    }
  }

  showError(message) {
    const errorDiv = document.getElementById("error-message")
    errorDiv.textContent = message
    errorDiv.classList.add("show")
    setTimeout(() => errorDiv.classList.remove("show"), 5000)
  }

  showMessage(message, type) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${type}`
    messageDiv.textContent = message
    document.body.appendChild(messageDiv)

    setTimeout(() => messageDiv.classList.add("show"), 100)
    setTimeout(() => {
      messageDiv.classList.remove("show")
      setTimeout(() => document.body.removeChild(messageDiv), 300)
    }, 3000)
  }
}

// Initialiser l'application
document.addEventListener("DOMContentLoaded", () => {
  window.app = new SenSanteApp()
})
