import { supabase } from '../services/api';

/**
 * Escape a string for SQL to prevent SQL injection
 * @param str The string to escape
 * @returns The escaped string
 */
function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) {
    return '';
  }
  return str.replace(/'/g, "''");
}

/**
 * Execute a SQL query directly using the Supabase client
 * @param query The SQL query to execute
 * @param params The parameters for the query
 * @returns The result of the query
 */
export async function executeSql(query: string, params?: any[]) {
  try {
    console.log('Executing SQL query:', query);
    console.log('SQL parameters:', params);

    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: query,
      params: params
    });

    if (error) {
      console.error('Error executing SQL query:', error);
      throw error;
    }

    console.log('SQL query result:', data);
    return data;
  } catch (err) {
    console.error('Exception executing SQL query:', err);
    throw err;
  }
}

/**
 * Update a company record directly using SQL
 * @param companyData The company data to update
 * @param userId The user ID
 * @returns The updated company data
 */
export async function updateCompanyDirectSql(companyData: any, userId: string) {
  try {
    console.log('Updating company with direct SQL for user:', userId);
    console.log('Company data:', companyData);

    // Escape all values to prevent SQL injection
    const name = escapeSql(companyData.name || 'Your Company Name');
    const logoUrl = companyData.logo_url ? escapeSql(companyData.logo_url) : null;
    const address = escapeSql(companyData.address || '');
    const phone = escapeSql(companyData.phone || '');
    const email = escapeSql(companyData.email || 'your@company.com');
    const website = escapeSql(companyData.website || '');
    const taxNumber = escapeSql(companyData.tax_number || '');

    // Use parameterized query for the check
    const checkSql = `
      SELECT id FROM companies WHERE user_id = $1 LIMIT 1;
    `;

    const checkResult = await executeSql(checkSql, [userId]);
    console.log('Check result:', checkResult);

    let result;

    if (checkResult && checkResult.length > 0) {
      // Company exists, update it
      const companyId = checkResult[0].id;
      console.log('Updating existing company with ID:', companyId);

      // Use parameterized query for the update
      const updateSql = `
        UPDATE companies
        SET
          name = $1,
          logo_url = $2,
          address = $3,
          phone = $4,
          email = $5,
          website = $6,
          tax_number = $7
        WHERE id = $8
        RETURNING *;
      `;

      const updateParams = [
        name,
        logoUrl,
        address,
        phone,
        email,
        website,
        taxNumber,
        companyId
      ];

      result = await executeSql(updateSql, updateParams);
    } else {
      // Company doesn't exist, create it
      console.log('Creating new company for user:', userId);

      // Use parameterized query for the insert
      const insertSql = `
        INSERT INTO companies (
          name, logo_url, address, phone, email, website, tax_number, user_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
        RETURNING *;
      `;

      const insertParams = [
        name,
        logoUrl,
        address,
        phone,
        email,
        website,
        taxNumber,
        userId
      ];

      result = await executeSql(insertSql, insertParams);
    }

    if (result && result.length > 0) {
      console.log('Company updated successfully via direct SQL:', result[0]);
      return result[0];
    } else {
      throw new Error('No result returned from SQL query');
    }
  } catch (err) {
    console.error('Error updating company with direct SQL:', err);
    throw err;
  }
}
