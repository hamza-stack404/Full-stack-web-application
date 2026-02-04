{{- define "todo.labels" -}}
app.kubernetes.io/name: todo-chatbot
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "todo.frontend.labels" -}}
{{ include "todo.labels" . }}
app: todo-frontend
component: frontend
{{- end }}

{{- define "todo.backend.labels" -}}
{{ include "todo.labels" . }}
app: todo-backend
component: backend
{{- end }}

{{- define "todo.frontend.selectorLabels" -}}
app: todo-frontend
{{- end }}

{{- define "todo.backend.selectorLabels" -}}
app: todo-backend
{{- end }}