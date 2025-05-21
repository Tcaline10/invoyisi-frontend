import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Edit2, Save, Search, RefreshCw } from 'lucide-react';
import { clientService } from '../../services/api';

interface DataPreviewDialogProps {
  isOpen: boolean;
  title: string;
  data: any;
  requiredFields: string[];
  fieldLabels: Record<string, string>;
  onConfirm: (updatedData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  editableFields?: string[];
  isInvoice?: boolean;
}

const DataPreviewDialog: React.FC<DataPreviewDialogProps> = ({
  isOpen,
  title,
  data,
  requiredFields,
  fieldLabels,
  onConfirm,
  onCancel,
  isLoading = false,
  editableFields = [],
  isInvoice = false
}) => {
  const [editedData, setEditedData] = useState<any>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showClientSelector, setShowClientSelector] = useState(false);

  // Reset state when dialog opens with new data
  useEffect(() => {
    console.log('DataPreviewDialog useEffect triggered:', { isOpen, data, isInvoice });

    if (isOpen && data) {
      console.log('Dialog is open with data, resetting state');
      setEditedData({...data});
      setIsEditing({});

      // If this is an invoice, handle client ID extraction
      if (isInvoice) {
        // Check for client_id in different formats and set it as selected
        // First check for numeric client_id
        if (data.client_id && !isNaN(Number(data.client_id))) {
          console.log('Setting selectedClientId from data.client_id (numeric):', data.client_id);
          setSelectedClientId(Number(data.client_id));
        }
        // Then check for string client_id that can be converted to number
        else if (data.client_id && typeof data.client_id === 'string' && !isNaN(Number(data.client_id))) {
          console.log('Setting selectedClientId from data.client_id (string):', Number(data.client_id));
          setSelectedClientId(Number(data.client_id));
        }
        // Then check for _selectedClientId
        else if (data._selectedClientId && !isNaN(Number(data._selectedClientId))) {
          console.log('Setting selectedClientId from data._selectedClientId:', data._selectedClientId);
          setSelectedClientId(Number(data._selectedClientId));
        }
        // If URL has client parameter, extract it
        else {
          const urlParams = new URLSearchParams(window.location.search);
          const clientParam = urlParams.get('client');
          if (clientParam && !isNaN(Number(clientParam))) {
            console.log('Setting selectedClientId from URL parameter:', clientParam);
            setSelectedClientId(Number(clientParam));
            // Also update the data
            setEditedData(prev => ({
              ...prev,
              client_id: Number(clientParam),
              _selectedClientId: Number(clientParam)
            }));
          }
        }

        // If we have available clients in the data, use them
        if (data._availableClients && data._availableClients.length) {
          console.log('Using available clients from data:', data._availableClients);
          setClients(data._availableClients);
        } else {
          // Otherwise load clients
          console.log('No available clients in data, loading clients');
          loadClients();
        }
      }
    }
  }, [isOpen, data, isInvoice]);

  // Load clients from the database
  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const loadedClients = await clientService.getClients();
      setClients(loadedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  if (!isOpen) return null;

  // Combine original data with edited data
  const combinedData = {...data, ...editedData};

  // If this is an invoice, ensure client_id is included in required fields check
  let effectiveRequiredFields = requiredFields;
  if (isInvoice && !requiredFields.includes('client_id')) {
    effectiveRequiredFields = [...requiredFields, 'client_id'];
  }

  // Check if all required fields are present and not empty
  const missingFields = effectiveRequiredFields.filter(field => {
    // Special handling for client_id - it's present if selectedClientId is set or _selectedClientId exists
    if (field === 'client_id' && (selectedClientId || combinedData._selectedClientId)) {
      return false;
    }
    return !combinedData[field] || (typeof combinedData[field] === 'string' && combinedData[field].trim() === '');
  });

  const hasAllRequiredFields = missingFields.length === 0;

  // Handle field value change
  const handleFieldChange = (field: string, value: any) => {
    setEditedData({
      ...editedData,
      [field]: value
    });
  };

  // Toggle editing mode for a field
  const toggleEditing = (field: string) => {
    setIsEditing({
      ...isEditing,
      [field]: !isEditing[field]
    });
  };

  // Check if a field is editable
  const isFieldEditable = (field: string) => {
    // Client ID is handled specially
    if (field === 'client_id') return false;
    return editableFields.includes(field) || requiredFields.includes(field);
  };

  // Handle client selection
  const handleClientSelect = (clientId: number) => {
    console.log('Client selected with ID:', clientId);

    // Ensure clientId is a number
    const numericClientId = Number(clientId);

    if (isNaN(numericClientId)) {
      console.error('Invalid client ID:', clientId);
      return;
    }

    setSelectedClientId(numericClientId);

    // Store the selected client ID in a special field that won't be removed
    handleFieldChange('_selectedClientId', numericClientId);

    // Also update the client_id field for backward compatibility
    handleFieldChange('client_id', numericClientId);

    // Log the updated data
    console.log('Updated data after client selection:', {...data, ...editedData, client_id: numericClientId, _selectedClientId: numericClientId});

    setShowClientSelector(false);
  };

  // Filter clients based on search term
  const filteredClients = clientSearchTerm
    ? clients.filter(client =>
        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        (client.company_name && client.company_name.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()))
      )
    : clients;

  // Get selected client details
  const selectedClient = clients.find(c => c.id === (selectedClientId || combinedData._selectedClientId || combinedData.client_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold flex items-center text-sm sm:text-base">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto flex-grow">
          <div className="mb-3 sm:mb-4">
            <p className="text-gray-700 text-sm sm:text-base">
              Please review the following data that will be stored in the database:
            </p>
          </div>

          {!hasAllRequiredFields && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
              <AlertTriangle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-yellow-700 font-medium text-sm sm:text-base">Missing required fields</p>
                <p className="text-yellow-600 text-xs sm:text-sm">
                  The following required fields are missing or empty:
                  {missingFields.map(field => ` ${fieldLabels[field] || field}`).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Client Selector for Invoices */}
          {isInvoice && (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Client</h3>
                <button
                  onClick={() => setShowClientSelector(!showClientSelector)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {showClientSelector ? 'Hide Client Selector' : 'Change Client'}
                </button>
              </div>

              {selectedClient ? (
                <div className={`p-2 sm:p-3 border rounded-md ${missingFields.includes('client_id') ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm sm:text-base">{selectedClient.name}</p>
                      {selectedClient.company_name && (
                        <p className="text-xs sm:text-sm text-gray-600">{selectedClient.company_name}</p>
                      )}
                      {selectedClient.email && (
                        <p className="text-xs sm:text-sm text-gray-600">{selectedClient.email}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Selected
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-700 text-sm">No client selected. Please select a client for this invoice.</p>
                </div>
              )}

              {showClientSelector && (
                <div className="mt-2 border border-gray-200 rounded-md">
                  <div className="p-2 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="Search clients..."
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                      />
                      <button
                        onClick={loadClients}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                        disabled={isLoadingClients}
                      >
                        <RefreshCw size={18} className={isLoadingClients ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-36 sm:max-h-48 overflow-y-auto">
                    {isLoadingClients ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Loading clients...
                      </div>
                    ) : filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {clientSearchTerm ? 'No clients match your search' : 'No clients found'}
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {filteredClients.map(client => (
                          <li
                            key={client.id}
                            className={`p-2 hover:bg-gray-50 cursor-pointer ${client.id === (selectedClientId || combinedData._selectedClientId || combinedData.client_id) ? 'bg-blue-50' : ''}`}
                            onClick={() => handleClientSelect(client.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{client.name}</p>
                                {client.company_name && (
                                  <p className="text-xs text-gray-600">{client.company_name}</p>
                                )}
                                {client.email && (
                                  <p className="text-xs text-gray-500">{client.email}</p>
                                )}
                              </div>
                              {client.id === (selectedClientId || combinedData._selectedClientId || combinedData.client_id) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Selected
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500">Field</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500">Value</th>
                  <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm font-medium text-gray-500 w-16 sm:w-24">Status</th>
                  <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm font-medium text-gray-500 w-12 sm:w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* First show missing required fields */}
                {missingFields.map(field => {
                  const label = fieldLabels[field] || field;

                  return (
                    <tr key={field} className="bg-yellow-50 hover:bg-yellow-100">
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-yellow-800">{label}</td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                        {isEditing[field] ? (
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 text-xs sm:text-sm"
                            value={editedData[field] || ''}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <span className="text-yellow-600 italic">Missing required value</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-center">
                        <span className="inline-flex items-center px-1 sm:px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Required
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-center">
                        <button
                          className="p-1 text-yellow-600 hover:text-yellow-900 focus:outline-none"
                          onClick={() => toggleEditing(field)}
                        >
                          {isEditing[field] ? <Save size={14} /> : <Edit2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Then show existing fields */}
                {Object.entries(combinedData).map(([key, value]) => {
                  // Skip rendering if value is undefined, null, or empty string
                  if (value === undefined || value === null || value === '') return null;

                  // Skip rendering if value is an empty array
                  if (Array.isArray(value) && value.length === 0) return null;

                  // Skip if this is a missing required field (already rendered above)
                  if (missingFields.includes(key)) return null;

                  // Skip client_id for invoices (handled separately)
                  if (isInvoice && key === 'client_id') return null;

                  // Skip internal fields (prefixed with _)
                  if (key.startsWith('_')) return null;

                  const isRequired = requiredFields.includes(key);
                  const label = fieldLabels[key] || key;
                  const canEdit = isFieldEditable(key);

                  // Determine if this is a successfully extracted required field
                  const isSuccessfullyExtracted = isRequired && value && (typeof value === 'string' ? value.trim() !== '' : true);

                  return (
                    <tr key={key} className={`hover:bg-gray-50 ${isSuccessfullyExtracted ? 'bg-green-50' : isRequired ? 'bg-blue-50' : ''}`}>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-700">{label}</td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-gray-500">
                        {isEditing[key] ? (
                          typeof value !== 'object' ? (
                            <input
                              type="text"
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                              value={editedData[key] || ''}
                              onChange={(e) => handleFieldChange(key, e.target.value)}
                              autoFocus
                            />
                          ) : (
                            <textarea
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                              value={JSON.stringify(value, null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  handleFieldChange(key, parsed);
                                } catch (err) {
                                  // If not valid JSON, just store as string
                                  handleFieldChange(key, e.target.value);
                                }
                              }}
                              rows={4}
                              autoFocus
                            />
                          )
                        ) : (
                          typeof value === 'object' ? (
                            Array.isArray(value) ? (
                              <div className="max-h-24 sm:max-h-32 overflow-y-auto">
                                <pre className="text-xs bg-gray-50 p-1 sm:p-2 rounded">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              </div>
                            ) : (
                              <pre className="text-xs bg-gray-50 p-1 sm:p-2 rounded">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            )
                          ) : (
                            <span className={isSuccessfullyExtracted ? "text-green-700 font-medium" : ""}>
                              {String(value)}
                            </span>
                          )
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-center">
                        {isRequired ? (
                          isSuccessfullyExtracted ? (
                            <span className="inline-flex items-center px-1 sm:px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Extracted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1 sm:px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Required
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-1 sm:px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-1 sm:py-2 text-center">
                        {canEdit && (
                          <button
                            className="p-1 text-gray-600 hover:text-gray-900 focus:outline-none"
                            onClick={() => toggleEditing(key)}
                          >
                            {isEditing[key] ? <Save size={14} /> : <Edit2 size={14} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-2 mt-4 sticky bottom-0 bg-white p-2 border-t border-gray-100">
            <button
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded flex items-center text-xs sm:text-sm ${
                hasAllRequiredFields
                  ? 'bg-blue-900 text-white hover:bg-blue-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-colors`}
              onClick={hasAllRequiredFields ? () => {
                console.log('Create button clicked in DataPreviewDialog');
                console.log('Data to be passed to onConfirm:', {...data, ...editedData});
                onConfirm({...data, ...editedData});
              } : undefined}
              disabled={!hasAllRequiredFields || isLoading}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <Check className="mr-1" size={14} />
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPreviewDialog;
