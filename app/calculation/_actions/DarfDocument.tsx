// app/calculation/_actions/DarfDocument.tsx

import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Estilos para o PDF (sem alterações)
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 10,
    border: "1px solid #333",
    padding: 8,
  },
  label: {
    fontSize: 8,
    color: "#555",
  },
  value: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  field: {
    width: "32%", // Ajustado para 3 colunas
  },
});

interface DarfDocumentProps {
  userName: string;
  userCpf: string;
  apuracao: string;
  vencimento: string;
  valorPrincipal: string;
  codigoReceita: string;
  generationDate: string; // NOVA PROPRIEDADE
}

export const DarfDocument = ({
  userName,
  userCpf,
  apuracao,
  vencimento,
  valorPrincipal,
  codigoReceita,
  generationDate, // NOVA PROPRIEDADE
}: DarfDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>
        DARF - Documento de Arrecadação de Receitas Federais
      </Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>01 - Nome / Telefone</Text>
            <Text style={styles.value}>{userName}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>02 - Período de Apuração</Text>
            <Text style={styles.value}>{apuracao}</Text>
          </View>
          {/* CAMPO NOVO ADICIONADO AO PDF */}
          <View style={styles.field}>
            <Text style={styles.label}>Data do Documento</Text>
            <Text style={styles.value}>{generationDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.field} style={{ width: "48%" }}>
            <Text style={styles.label}>03 - Número do CPF</Text>
            <Text style={styles.value}>{userCpf}</Text>
          </View>
          <View style={styles.field} style={{ width: "48%" }}>
            <Text style={styles.label}>04 - Código da Receita</Text>
            <Text style={styles.value}>{codigoReceita}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.field} style={{ width: "48%" }}>
            <Text style={styles.label}>06 - Data de Vencimento</Text>
            <Text style={styles.value}>{vencimento}</Text>
          </View>
          <View style={styles.field} style={{ width: "48%" }}>
            <Text style={styles.label}>07 - Valor Principal</Text>
            <Text style={styles.value}>R$ {valorPrincipal}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.field} style={{ width: "48%" }}>
            <Text style={styles.label}>08 - Valor da Multa</Text>
            <Text style={styles.value}>R$ 0,00</Text>
          </View>
          <View style={styles.field} style={{ width: "48%" }}>
            <Text style={styles.label}>09 - Valor dos Juros</Text>
            <Text style={styles.value}>R$ 0,00</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>10 - Valor Total</Text>
        <Text style={styles.value}>R$ {valorPrincipal}</Text>
      </View>
    </Page>
  </Document>
);
