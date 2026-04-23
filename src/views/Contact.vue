<script setup>
import { QCard, QCardSection, QIcon, QSeparator } from 'quasar'
</script>

<template>
  <div class="content-width">
    <h1>Contact</h1>
    <QSeparator />

    <div class="row q-col-gutter-lg q-mt-md">
      <!-- Feedback -->
      <div class="col-12 col-sm-6">
        <QCard flat bordered class="contact-card full-height">
          <QCardSection class="q-pa-lg">
            <div class="contact-card__icon-wrap">
              <QIcon name="fab fa-github" size="1.25rem" color="primary" />
            </div>
            <div class="contact-card__title">Bug reports &amp; Feature requests</div>
            <p class="contact-card__desc">
              Found something broken or have an idea to improve IHR? Submit an issue on GitHub.
            </p>
            <a
              href="https://github.com/InternetHealthReport/ihr-website/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="contact-card__link"
            >
              github.com/InternetHealthReport/ihr-website/issues
              <QIcon name="fas fa-external-link-alt" size="0.65rem" class="q-ml-xs" />
            </a>
          </QCardSection>
        </QCard>
      </div>

      <!-- Others -->
      <div class="col-12 col-sm-6">
        <QCard flat bordered class="contact-card full-height">
          <QCardSection class="q-pa-lg">
            <div class="contact-card__icon-wrap">
              <QIcon name="fas fa-envelope" size="1.25rem" color="primary" />
            </div>
            <div class="contact-card__title">Questions &amp; Inquiries</div>
            <p class="contact-card__desc">
              For general questions, collaboration opportunities, or anything else, reach us by
              email.
            </p>
            <a href="mailto:admin@ihr.live" class="contact-card__link">
              admin@ihr.live
              <QIcon name="fas fa-external-link-alt" size="0.65rem" class="q-ml-xs" />
            </a>
          </QCardSection>
        </QCard>
      </div>
    </div>

    <div class="contact-note">
      Internet Health Report is an open project. Community contributions are always welcome.
    </div>
  </div>
</template>

<style scoped>
/* ===== CARDS ===== */
.contact-card {
  border-radius: 10px !important;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.contact-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.contact-card__icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e6f1fb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.contact-card__link {
  font-size: 0.875rem;
  color: #185fa5;
  text-decoration: none;
  font-weight: 500;
  word-break: break-word;
  display: inline-flex;
  align-items: center;
}
.contact-card__link:hover {
  text-decoration: underline;
}

/* ===== NOTE ===== */
.contact-note {
  margin-top: 2.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.75rem;
  line-height: 1.6;
}
</style>
